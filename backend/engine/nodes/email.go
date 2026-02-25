package nodes

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// EmailNode sends an email using SMTP via a shared email config.
type EmailNode struct{}

func (n *EmailNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, resolveConfig engine.ConfigResolver) (map[string]interface{}, error) {
	// Resolve email config
	configIDRaw, ok := node.Properties["configId"]
	if !ok {
		return nil, fmt.Errorf("email node: configId is required")
	}
	configID, err := toInt64(configIDRaw)
	if err != nil {
		return nil, fmt.Errorf("email node: invalid configId: %w", err)
	}

	cfg, err := resolveConfig(configID)
	if err != nil {
		return nil, fmt.Errorf("email node: failed to resolve config %d: %w", configID, err)
	}
	if cfg.Type != "email" {
		return nil, fmt.Errorf("email node: config %d is not an email config (got %s)", configID, cfg.Type)
	}

	// Extract SMTP settings from config
	smtpHost, _ := cfg.Config["host"].(string)
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}

	smtpPort := "587"
	if portRaw, ok := cfg.Config["port"]; ok {
		switch v := portRaw.(type) {
		case string:
			smtpPort = v
		case float64:
			smtpPort = strconv.Itoa(int(v))
		}
	}

	username, _ := cfg.Config["username"].(string)
	password, _ := cfg.Config["password"].(string)
	fromAddr, _ := cfg.Config["from"].(string)
	if fromAddr == "" {
		fromAddr = username
	}

	useTLS := true
	if tlsRaw, ok := cfg.Config["tls"]; ok {
		if b, ok := tlsRaw.(bool); ok {
			useTLS = b
		}
	}

	// Extract email fields from node properties (with fallback to input)
	to := getStringProp(node.Properties, input, "to")
	cc := getStringProp(node.Properties, input, "cc")
	bcc := getStringProp(node.Properties, input, "bcc")
	subject := getStringProp(node.Properties, input, "subject")
	body := getStringProp(node.Properties, input, "body")
	contentType := "text/plain"
	if ct, _ := node.Properties["contentType"].(string); ct != "" {
		contentType = ct
	}

	if to == "" {
		return nil, fmt.Errorf("email node: 'to' address is required")
	}
	if subject == "" {
		subject = "(no subject)"
	}

	// Build email message
	toAddrs := parseAddresses(to)
	ccAddrs := parseAddresses(cc)
	bccAddrs := parseAddresses(bcc)

	allRecipients := append(append(toAddrs, ccAddrs...), bccAddrs...)

	headers := fmt.Sprintf("From: %s\r\n", fromAddr)
	headers += fmt.Sprintf("To: %s\r\n", strings.Join(toAddrs, ", "))
	if len(ccAddrs) > 0 {
		headers += fmt.Sprintf("Cc: %s\r\n", strings.Join(ccAddrs, ", "))
	}
	headers += fmt.Sprintf("Subject: %s\r\n", subject)
	headers += fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z))
	headers += fmt.Sprintf("MIME-Version: 1.0\r\n")
	headers += fmt.Sprintf("Content-Type: %s; charset=\"utf-8\"\r\n", contentType)
	headers += "\r\n"

	msg := headers + body

	// Send via SMTP
	addr := net.JoinHostPort(smtpHost, smtpPort)

	var auth smtp.Auth
	if username != "" && password != "" {
		auth = smtp.PlainAuth("", username, password, smtpHost)
	}

	var sendErr error
	if useTLS && smtpPort == "465" {
		// SSL/TLS on port 465 — direct TLS connection
		sendErr = sendMailTLS(addr, smtpHost, auth, fromAddr, allRecipients, []byte(msg))
	} else {
		// STARTTLS on port 587 or plain
		sendErr = smtp.SendMail(addr, auth, fromAddr, allRecipients, []byte(msg))
	}

	if sendErr != nil {
		return nil, fmt.Errorf("email node: failed to send: %w", sendErr)
	}

	return map[string]interface{}{
		"sent":       true,
		"to":         to,
		"cc":         cc,
		"bcc":        bcc,
		"subject":    subject,
		"from":       fromAddr,
		"smtpHost":   smtpHost,
		"sentAt":     time.Now().Format(time.RFC3339),
		"recipients": len(allRecipients),
	}, nil
}

// sendMailTLS handles direct SSL/TLS connections (port 465).
func sendMailTLS(addr, host string, auth smtp.Auth, from string, to []string, msg []byte) error {
	tlsConfig := &tls.Config{
		ServerName: host,
	}
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("TLS dial failed: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("SMTP client failed: %w", err)
	}
	defer client.Close()

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP auth failed: %w", err)
		}
	}

	if err := client.Mail(from); err != nil {
		return err
	}
	for _, rcpt := range to {
		if err := client.Rcpt(rcpt); err != nil {
			return err
		}
	}

	w, err := client.Data()
	if err != nil {
		return err
	}
	_, err = w.Write(msg)
	if err != nil {
		return err
	}
	return w.Close()
}

func getStringProp(props map[string]interface{}, input map[string]interface{}, key string) string {
	if v, ok := props[key].(string); ok && v != "" {
		return v
	}
	if v, ok := input[key].(string); ok && v != "" {
		return v
	}
	return ""
}

func parseAddresses(s string) []string {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, ",")
	var addrs []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			addrs = append(addrs, p)
		}
	}
	return addrs
}
