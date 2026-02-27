package nodes

import (
	"bytes"
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
	"golang.org/x/crypto/ssh"
)

// SSHNode connects to a remote host via SSH and runs a command, returning stdout/stderr.
type SSHNode struct{}

func (n *SSHNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, resolveConfig engine.ConfigResolver) (map[string]interface{}, error) {
	props := node.Properties
	if props == nil {
		props = make(map[string]interface{})
	}

	configID, _ := props["configId"].(float64)
	if configID == 0 {
		return nil, fmt.Errorf("ssh node: configId is required")
	}

	cfg, err := resolveConfig(int64(configID))
	if err != nil {
		return nil, fmt.Errorf("ssh node: resolve config: %w", err)
	}
	if cfg.Type != "ssh" {
		return nil, fmt.Errorf("ssh node: config %d is not ssh type (got %s)", int64(configID), cfg.Type)
	}

	host, _ := cfg.Config["host"].(string)
	if host == "" {
		return nil, fmt.Errorf("ssh node: config host is required")
	}
	port := 22
	if p, ok := cfg.Config["port"].(float64); ok && p > 0 {
		port = int(p)
	}
	user, _ := cfg.Config["username"].(string)
	if user == "" {
		user, _ = cfg.Config["user"].(string)
	}
	if user == "" {
		return nil, fmt.Errorf("ssh node: config username is required")
	}

	authMethod, _ := cfg.Config["authMethod"].(string)
	if authMethod == "" {
		authMethod = "password"
	}

	var auth []ssh.AuthMethod
	switch authMethod {
	case "password":
		password, _ := cfg.Config["password"].(string)
		auth = []ssh.AuthMethod{ssh.Password(password)}
	case "privateKey":
		pem, _ := cfg.Config["privateKey"].(string)
		if pem == "" {
			return nil, fmt.Errorf("ssh node: config privateKey is required when authMethod is privateKey")
		}
		signer, err := ssh.ParsePrivateKey([]byte(pem))
		if err != nil {
			return nil, fmt.Errorf("ssh node: parse private key: %w", err)
		}
		auth = []ssh.AuthMethod{ssh.PublicKeys(signer)}
	default:
		return nil, fmt.Errorf("ssh node: unsupported authMethod %q", authMethod)
	}

	command, _ := props["command"].(string)
	if command == "" {
		if v, ok := input["command"].(string); ok {
			command = v
		}
	}
	if command == "" {
		return nil, fmt.Errorf("ssh node: command is required")
	}

	timeoutMs, _ := props["timeoutMs"].(float64)
	if timeoutMs <= 0 {
		timeoutMs = 30000
	}
	timeout := time.Duration(timeoutMs) * time.Millisecond
	runCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	clientConfig := &ssh.ClientConfig{
		User:            user,
		Auth:            auth,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	addr := netJoinHostPort(host, port)
	client, err := ssh.Dial("tcp", addr, clientConfig)
	if err != nil {
		return nil, fmt.Errorf("ssh node: dial %s: %w", addr, err)
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return nil, fmt.Errorf("ssh node: new session: %w", err)
	}
	defer session.Close()

	var stdout, stderr bytes.Buffer
	session.Stdout = &stdout
	session.Stderr = &stderr

	startTime := time.Now()
	done := make(chan error, 1)
	go func() { done <- session.Run(command) }()

	var runErr error
	select {
	case runErr = <-done:
	case <-runCtx.Done():
		_ = session.Signal(ssh.SIGKILL)
		_ = client.Close()
		<-done
		return nil, fmt.Errorf("ssh node: command timed out after %v", timeout)
	}
	duration := time.Since(startTime).Milliseconds()

	exitCode := 0
	if runErr != nil {
		if exitErr, ok := runErr.(*ssh.ExitError); ok {
			exitCode = exitErr.ExitStatus()
		} else {
			return nil, fmt.Errorf("ssh node: run command: %w", runErr)
		}
	}

	output := map[string]interface{}{
		"stdout":     stdout.String(),
		"stderr":     stderr.String(),
		"exitCode":   exitCode,
		"command":    command,
		"host":       host,
		"durationMs": duration,
		"success":    exitCode == 0,
	}
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}
	return output, nil
}

func netJoinHostPort(host string, port int) string {
	if strings.Contains(host, ":") {
		return host
	}
	return host + ":" + strconv.Itoa(port)
}
