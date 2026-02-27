package nodes

import (
	"context"
	"encoding/json"
	"fmt"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// HttpOutNode sends the HTTP response back to the client that triggered the flow via HTTP-in.
// Reads statusCode and body (or payload) from node output and writes to the response writer.
type HttpOutNode struct{}

func (n *HttpOutNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	hr := engine.HttpRunFromContext(ctx)
	if hr == nil || hr.W == nil || hr.Sent == nil {
		// Not in an HTTP-triggered run; pass through
		return input, nil
	}
	if *hr.Sent {
		return input, nil
	}

	w := hr.W

	// Status code from properties or input
	statusCode := 200
	if node.Properties != nil {
		if sc, ok := node.Properties["statusCode"].(float64); ok {
			statusCode = int(sc)
		}
	}
	if sc, ok := input["statusCode"].(float64); ok {
		statusCode = int(sc)
	}
	if sc, ok := input["statusCode"].(int); ok {
		statusCode = sc
	}

	// Body: prefer explicit "body", then "payload", then JSON of the whole input
	var body []byte
	if b, ok := input["body"].(string); ok && b != "" {
		body = []byte(b)
	} else if b, ok := input["body"].([]byte); ok {
		body = b
	} else if payload, ok := input["payload"]; ok {
		body, _ = json.Marshal(payload)
	} else {
		body, _ = json.Marshal(input)
	}

	// Optional Content-Type from properties or input
	contentType := "application/json"
	if node.Properties != nil {
		if ct, ok := node.Properties["contentType"].(string); ok && ct != "" {
			contentType = ct
		}
	}
	if ct, ok := input["contentType"].(string); ok && ct != "" {
		contentType = ct
	}

	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(statusCode)
	if _, err := w.Write(body); err != nil {
		return nil, fmt.Errorf("http_out: write response: %w", err)
	}

	*hr.Sent = true

	output := map[string]interface{}{
		"sent":       true,
		"statusCode": statusCode,
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
