package nodes

import (
	"context"
	"eflo/backend/engine"
	"eflo/backend/models"
)

// ContinueNode is like Node-RED's continue node: it runs when the node configured in
// "after_node_id" has finished execution. It passes through its input (typically
// from the node it waits for, via an edge) to downstream nodes.
type ContinueNode struct{}

func (n *ContinueNode) Execute(_ context.Context, _ models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	output := map[string]interface{}{
		"continued": true,
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
