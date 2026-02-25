package imaputil

import (
	"bufio"
	"crypto/tls"
	"fmt"
	"io"
	"log"
	"net"
	"strconv"
	"strings"
	"time"

	"eflo/backend/models"
)

// FetchNewEmails connects to an IMAP server and fetches unseen email headers.
func FetchNewEmails(cfg *models.NodeConfig, mailbox string, markSeen bool, maxFetch uint32) ([]map[string]interface{}, error) {
	if cfg.Type != "email" {
		return nil, fmt.Errorf("config is not email type (got %s)", cfg.Type)
	}

	imapHost, _ := cfg.Config["imapHost"].(string)
	if imapHost == "" {
		smtpHost, _ := cfg.Config["host"].(string)
		if strings.HasPrefix(smtpHost, "smtp.") {
			imapHost = "imap." + smtpHost[5:]
		} else {
			imapHost = smtpHost
		}
	}
	imapPort := "993"
	if p, ok := cfg.Config["imapPort"]; ok {
		switch v := p.(type) {
		case string:
			imapPort = v
		case float64:
			imapPort = strconv.Itoa(int(v))
		}
	}
	username, _ := cfg.Config["username"].(string)
	password, _ := cfg.Config["password"].(string)

	if mailbox == "" {
		mailbox = "INBOX"
	}
	if maxFetch == 0 {
		maxFetch = 10
	}

	addr := net.JoinHostPort(imapHost, imapPort)
	tlsCfg := &tls.Config{ServerName: imapHost}
	conn, err := tls.DialWithDialer(&net.Dialer{Timeout: 15 * time.Second}, "tcp", addr, tlsCfg)
	if err != nil {
		return nil, fmt.Errorf("IMAP connection failed (%s): %w", addr, err)
	}
	defer conn.Close()

	reader := bufio.NewReader(conn)

	if _, err := readLine(reader); err != nil {
		return nil, fmt.Errorf("IMAP greeting failed: %w", err)
	}

	if err := cmd(conn, reader, "A001", fmt.Sprintf(`LOGIN "%s" "%s"`, escape(username), escape(password))); err != nil {
		return nil, fmt.Errorf("IMAP LOGIN failed: %w", err)
	}

	if err := cmd(conn, reader, "A002", fmt.Sprintf("SELECT %s", mailbox)); err != nil {
		return nil, fmt.Errorf("IMAP SELECT failed: %w", err)
	}

	searchResp, err := cmdUntagged(conn, reader, "A003", "SEARCH UNSEEN")
	if err != nil {
		return nil, fmt.Errorf("IMAP SEARCH failed: %w", err)
	}

	uids := parseSearch(searchResp)
	if len(uids) == 0 {
		_ = cmd(conn, reader, "A999", "LOGOUT")
		return nil, nil
	}

	if len(uids) > int(maxFetch) {
		uids = uids[len(uids)-int(maxFetch):]
	}

	var results []map[string]interface{}

	for i, uid := range uids {
		tag := fmt.Sprintf("F%d", i)
		fetchCmd := fmt.Sprintf("FETCH %d (FLAGS BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)])", uid)
		lines, err := cmdUntagged(conn, reader, tag, fetchCmd)
		if err != nil {
			log.Printf("[EmailReceive] FETCH %d failed: %v", uid, err)
			continue
		}

		emailData := parseHeaders(lines, uid)
		emailData["fetchedAt"] = time.Now().Format(time.RFC3339)
		results = append(results, emailData)

		if markSeen {
			stag := fmt.Sprintf("S%d", i)
			_ = cmd(conn, reader, stag, fmt.Sprintf("STORE %d +FLAGS (\\Seen)", uid))
		}
	}

	_ = cmd(conn, reader, "A999", "LOGOUT")
	return results, nil
}

func cmd(conn net.Conn, reader *bufio.Reader, tag, c string) error {
	_, err := fmt.Fprintf(conn, "%s %s\r\n", tag, c)
	if err != nil {
		return err
	}
	for {
		resp, err := readLine(reader)
		if err != nil {
			return err
		}
		if strings.HasPrefix(resp, tag+" OK") {
			return nil
		}
		if strings.HasPrefix(resp, tag+" NO") || strings.HasPrefix(resp, tag+" BAD") {
			return fmt.Errorf("%s", resp)
		}
	}
}

func cmdUntagged(conn net.Conn, reader *bufio.Reader, tag, c string) ([]string, error) {
	_, err := fmt.Fprintf(conn, "%s %s\r\n", tag, c)
	if err != nil {
		return nil, err
	}
	var lines []string
	for {
		resp, err := readLine(reader)
		if err != nil {
			return lines, err
		}
		if strings.HasPrefix(resp, tag+" OK") {
			return lines, nil
		}
		if strings.HasPrefix(resp, tag+" NO") || strings.HasPrefix(resp, tag+" BAD") {
			return lines, fmt.Errorf("%s", resp)
		}
		lines = append(lines, resp)
	}
}

func readLine(reader *bufio.Reader) (string, error) {
	line, err := reader.ReadString('\n')
	if err != nil && err != io.EOF {
		return "", err
	}
	return strings.TrimRight(line, "\r\n"), nil
}

func parseSearch(lines []string) []int {
	var uids []int
	for _, line := range lines {
		if strings.Contains(line, "SEARCH") {
			parts := strings.Fields(line)
			for _, p := range parts {
				if uid, err := strconv.Atoi(p); err == nil {
					uids = append(uids, uid)
				}
			}
		}
	}
	return uids
}

func parseHeaders(lines []string, seqNum int) map[string]interface{} {
	data := map[string]interface{}{"seqNum": seqNum}
	full := strings.Join(lines, "\n")

	extract := func(name string) string {
		lower := strings.ToLower(full)
		key := strings.ToLower(name) + ":"
		idx := strings.Index(lower, key)
		if idx < 0 {
			return ""
		}
		start := idx + len(key)
		end := strings.IndexAny(full[start:], "\r\n)")
		if end < 0 {
			end = len(full) - start
		}
		return strings.TrimSpace(full[start : start+end])
	}

	if v := extract("From"); v != "" {
		data["from"] = v
	}
	if v := extract("To"); v != "" {
		data["to"] = v
	}
	if v := extract("Cc"); v != "" {
		data["cc"] = v
	}
	if v := extract("Subject"); v != "" {
		data["subject"] = v
	}
	if v := extract("Date"); v != "" {
		data["date"] = v
	}
	if v := extract("Message-ID"); v != "" {
		data["messageId"] = v
	}

	return data
}

func escape(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `"`, `\"`)
	return s
}
