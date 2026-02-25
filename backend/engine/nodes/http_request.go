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
	method, _ := node.Properties["method"].(string)
	if method == "" {
		method = "GET"
	}
	url, _ := node.Properties["url"].(string)
	if url == "" {
		return nil, fmt.Errorf("http_request node: url is required")
	}

	body, _ := node.Properties["body"].(string)

	var bodyReader io.Reader
	if body != "" {
		bodyReader = strings.NewReader(body)
	}

	req, err := http.NewRequestWithContext(ctx, strings.ToUpper(method), url, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("http_request: failed to create request: %w", err)
	}

	// Set headers from properties
	if headers, ok := node.Properties["headers"].(map[string]interface{}); ok {
		for k, v := range headers {
			req.Header.Set(k, fmt.Sprintf("%v", v))
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
