package nodes

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"

	"eflo/backend/engine"
	"eflo/backend/models"
)

var graphqlPlaceholderRE = regexp.MustCompile(`\{\{([^}]+)\}\}`)

// GraphQLNode calls a GraphQL API with a query and variables. Variables JSON can use
// {{key}} or {{input.key}} to substitute values from the upstream input.
type GraphQLNode struct{}

func (n *GraphQLNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	if input == nil {
		input = make(map[string]interface{})
	}

	urlStr, _ := node.Properties["url"].(string)
	if urlStr == "" {
		return nil, fmt.Errorf("graphql node: url is required")
	}

	query, _ := node.Properties["query"].(string)
	if query == "" {
		return nil, fmt.Errorf("graphql node: query is required")
	}

	variablesStr, _ := node.Properties["variables"].(string)
	var variables map[string]interface{}
	if variablesStr != "" {
		// Substitute {{path}} in variables JSON with values from input
		resolved, err := substituteVariables(variablesStr, input)
		if err != nil {
			return nil, fmt.Errorf("graphql node: variables: %w", err)
		}
		if err := json.Unmarshal([]byte(resolved), &variables); err != nil {
			return nil, fmt.Errorf("graphql node: variables JSON: %w", err)
		}
	}
	if variables == nil {
		variables = make(map[string]interface{})
	}

	body := map[string]interface{}{
		"query":     query,
		"variables": variables,
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("graphql node: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("graphql node: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Optional headers from properties
	if headers, ok := node.Properties["headers"].(map[string]interface{}); ok {
		for k, v := range headers {
			req.Header.Set(k, fmt.Sprintf("%v", v))
		}
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("graphql node: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("graphql node: read response: %w", err)
	}

	output := map[string]interface{}{
		"statusCode": resp.StatusCode,
		"body":       string(respBody),
	}
	var gqlResp struct {
		Data   interface{} `json:"data"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}
	if err := json.Unmarshal(respBody, &gqlResp); err == nil {
		output["data"] = gqlResp.Data
		if len(gqlResp.Errors) > 0 {
			var errMsgs []string
			for _, e := range gqlResp.Errors {
				errMsgs = append(errMsgs, e.Message)
			}
			return nil, fmt.Errorf("graphql errors: %s", strings.Join(errMsgs, "; "))
		}
	}
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}
	return output, nil
}

// substituteVariables replaces {{path}} in the variables JSON string with values from input.
// path can be "key" or "input.key" for nested input. Values are JSON-encoded so the result stays valid JSON.
func substituteVariables(variablesStr string, input map[string]interface{}) (string, error) {
	matches := graphqlPlaceholderRE.FindAllStringSubmatchIndex(variablesStr, -1)
	if len(matches) == 0 {
		return variablesStr, nil
	}

	var buf strings.Builder
	last := 0
	for _, m := range matches {
		path := strings.TrimSpace(variablesStr[m[2]:m[3]])
		if strings.HasPrefix(path, "input.") {
			path = path[7:]
		}
		v, err := getNested(input, path)
		if err != nil {
			return "", fmt.Errorf("placeholder {{%s}}: %w", path, err)
		}
		encoded, err := json.Marshal(v)
		if err != nil {
			return "", fmt.Errorf("placeholder {{%s}}: %w", path, err)
		}
		buf.WriteString(variablesStr[last:m[0]])
		buf.Write(encoded)
		last = m[1]
	}
	buf.WriteString(variablesStr[last:])
	return buf.String(), nil
}
