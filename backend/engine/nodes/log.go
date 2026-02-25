package nodes

import (
	"context"
	"eflo/backend/engine"
	"fmt"
	"log"

	"eflo/backend/models"
)

type LogNode struct{}

func (n *LogNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	message, _ := node.Properties["message"].(string)
	if message == "" {
		message = fmt.Sprintf("%v", input)
	}

	log.Printf("[LOG NODE %s] %s | input: %v", node.ID, message, input)

	output := map[string]interface{}{
		"logged":  true,
		"message": message,
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
