package nodes

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"

	v8 "rogchap.com/v8go"
)

// FunctionNode runs JavaScript code in a V8 isolate and returns the result to the flow.
// Input is exposed as `input` in JS; the script should set `returnValue` to pass data downstream.
type FunctionNode struct{}

func (n *FunctionNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	code, _ := node.Properties["code"].(string)
	if code == "" {
		return nil, fmt.Errorf("function node: 'code' is required")
	}

	timeoutMs, _ := node.Properties["timeoutMs"].(float64)
	if timeoutMs <= 0 {
		timeoutMs = 10000
	}
	timeout := time.Duration(timeoutMs) * time.Millisecond

	// Serialize input for injection into JS
	inputJSON, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("function node: failed to marshal input: %w", err)
	}
	escaped := escapeForJS(string(inputJSON))

	iso := v8.NewIsolate()
	defer iso.Dispose()
	v8ctx := v8.NewContext(iso)
	defer v8ctx.Close()

	// Inject input as global `input`
	bootstrap := fmt.Sprintf("var input = JSON.parse('%s');", escaped)
	if _, err := v8ctx.RunScript(bootstrap, "bootstrap.js"); err != nil {
		return nil, fmt.Errorf("function node: failed to inject input: %w", err)
	}

	// Run user script with timeout
	done := make(chan struct{})
	var runErr error
	go func() {
		defer close(done)
		_, runErr = v8ctx.RunScript(code, "function.js")
	}()

	select {
	case <-done:
		if runErr != nil {
			if jsErr, ok := runErr.(*v8.JSError); ok {
				return nil, fmt.Errorf("function node: %s (at %s)", jsErr.Message, jsErr.Location)
			}
			return nil, fmt.Errorf("function node: %w", runErr)
		}
	case <-time.After(timeout):
		iso.TerminateExecution()
		<-done
		return nil, fmt.Errorf("function node: script timed out after %v", timeout)
	case <-ctx.Done():
		iso.TerminateExecution()
		<-done
		return nil, ctx.Err()
	}

	// Check if returnValue is defined. If not, stop the flow at this node.
	hasReturnVal, err := v8ctx.RunScript("typeof returnValue !== 'undefined'", "hasReturn.js")
	if err != nil {
		return nil, fmt.Errorf("function node: failed to inspect returnValue: %w", err)
	}
	if !hasReturnVal.Boolean() {
		// No explicit returnValue: mark this node as terminal so the engine does not continue.
		return map[string]interface{}{
			"_stop": true,
		}, nil
	}

	// Get returnValue only (no fallback to input)
	resultScript := "JSON.stringify(returnValue)"
	val, err := v8ctx.RunScript(resultScript, "result.js")
	if err != nil {
		return nil, fmt.Errorf("function node: failed to get result: %w", err)
	}

	resultStr := val.String()
	var resultData interface{}
	if err := json.Unmarshal([]byte(resultStr), &resultData); err != nil {
		return nil, fmt.Errorf("function node: result is not valid JSON: %w", err)
	}

	// When a value is returned:
	// - If it's an object, it becomes the full output map (and thus the next node's input).
	// - Otherwise, it is wrapped as { value: <primitive/array> }.
	if m, ok := resultData.(map[string]interface{}); ok {
		return m, nil
	}
	return map[string]interface{}{
		"value": resultData,
	}, nil
}

func escapeForJS(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "'", "\\'")
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\r", "\\r")
	return s
}
