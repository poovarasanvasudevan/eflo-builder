package nodes

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// ExecNode runs a system command and captures stdout/stderr.
type ExecNode struct{}

func (n *ExecNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	command, _ := node.Properties["command"].(string)
	if command == "" {
		if v, ok := input["command"].(string); ok {
			command = v
		}
	}
	if command == "" {
		return nil, fmt.Errorf("exec node: 'command' is required")
	}

	shell, _ := node.Properties["shell"].(string)
	if shell == "" {
		if runtime.GOOS == "windows" {
			shell = "cmd"
		} else {
			shell = "/bin/sh"
		}
	}

	timeoutMs, _ := node.Properties["timeoutMs"].(float64)
	if timeoutMs <= 0 {
		timeoutMs = 30000 // 30 sec default
	}

	timeout := time.Duration(timeoutMs) * time.Millisecond
	cmdCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" && (shell == "cmd" || shell == "cmd.exe") {
		cmd = exec.CommandContext(cmdCtx, "cmd", "/C", command)
	} else if strings.Contains(shell, "powershell") {
		cmd = exec.CommandContext(cmdCtx, shell, "-Command", command)
	} else {
		cmd = exec.CommandContext(cmdCtx, shell, "-c", command)
	}

	// Set working directory if provided
	if wd, ok := node.Properties["workingDir"].(string); ok && wd != "" {
		cmd.Dir = wd
	}

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	startTime := time.Now()
	err := cmd.Run()
	duration := time.Since(startTime).Milliseconds()

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			return nil, fmt.Errorf("exec node: failed to run command: %w", err)
		}
	}

	output := map[string]interface{}{
		"stdout":     stdout.String(),
		"stderr":     stderr.String(),
		"exitCode":   exitCode,
		"command":    command,
		"shell":      shell,
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
