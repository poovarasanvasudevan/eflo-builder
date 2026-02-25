package nodes

import (
	"context"
	"eflo/backend/engine"
	"eflo/backend/models"
)

type StartNode struct{}

func (n *StartNode) Execute(_ context.Context, _ models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	// Pass-through: just forward any input data
	if input == nil {
		return map[string]interface{}{"started": true}, nil
	}
	return input, nil
}
