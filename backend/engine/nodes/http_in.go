package nodes

import (
	"context"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// HttpInNode is the trigger entry for HTTP-in flows (like Node-RED). When a request
// hits the registered path, the workflow runs with request data in input; this node
// just passes that input through.
type HttpInNode struct{}

func (n *HttpInNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	output := map[string]interface{}{
		"triggered":   true,
		"triggeredAt": time.Now().Format(time.RFC3339),
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
