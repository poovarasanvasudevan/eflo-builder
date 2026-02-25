package nodes

import (
	"context"
	"eflo/backend/engine"
	"eflo/backend/models"
)

type EndNode struct{}

func (n *EndNode) Execute(_ context.Context, _ models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	result := map[string]interface{}{
		"finished": true,
	}
	for k, v := range input {
		result[k] = v
	}
	return result, nil
}
