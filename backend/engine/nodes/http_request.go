package nodes

import (
	"context"
	"eflo/backend/engine"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"eflo/backend/models"
)

type HttpRequestNode struct{}

func (n *HttpRequestNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	if input == nil {
		input = map[string]interface{}{}
	}
	method, _ := node.Properties["method"].(string)
	if method == "" {
		method = "GET"
	}
	url, _ := node.Properties["url"].(string)
	if url == "" {
		return nil, fmt.Errorf("http_request node: url is required")
	}
	// Resolve {{config.token}}, {{input.xxx}}, etc.
	url, err := ResolvePlaceholders(url, input)
	if err != nil {
		return nil, fmt.Errorf("http_request node: url placeholders: %w", err)
	}

	body, _ := node.Properties["body"].(string)
	if body != "" {
		body, err = ResolvePlaceholders(body, input)
		if err != nil {
			return nil, fmt.Errorf("http_request node: body placeholders: %w", err)
		}
	}

	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}

	req, err := http.NewRequestWithContext(ctx, strings.ToUpper(method), url, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("http_request: failed to create request: %w", err)
	}

	// Set headers from properties (object or JSON string); resolve {{config.xxx}} / {{input.xxx}}
	if h := node.Properties["headers"]; h != nil {
		var headerMap map[string]interface{}
		switch v := h.(type) {
		case map[string]interface{}:
			headerMap = v
		case string:
			if v != "" {
				if err := json.Unmarshal([]byte(v), &headerMap); err != nil {
					// ignore invalid JSON; leave headers unset
					headerMap = nil
				}
			}
		}
		for k, v := range headerMap {
			strVal := fmt.Sprintf("%v", v)
			resolved, err := ResolvePlaceholders(strVal, input)
			if err == nil {
				strVal = resolved
			}
			req.Header.Set(k, strVal)
		}
	}

	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http_request: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("http_request: failed to read response: %w", err)
	}

	output := map[string]interface{}{
		"statusCode": resp.StatusCode,
		"body":       string(respBody),
	}

	// Try to parse body as JSON
	var jsonBody interface{}
	if err := json.Unmarshal(respBody, &jsonBody); err == nil {
		output["json"] = jsonBody
	}

	return output, nil
}
