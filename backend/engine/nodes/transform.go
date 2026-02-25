package nodes

import (
	"context"
	"eflo/backend/engine"
	"fmt"

	"eflo/backend/models"

	"github.com/expr-lang/expr"
)

type TransformNode struct{}

func (n *TransformNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	expression, _ := node.Properties["expression"].(string)
	if expression == "" {
		// If no expression, pass through
		return input, nil
	}

	env := map[string]interface{}{}
	for k, v := range input {
		env[k] = v
	}

	program, err := expr.Compile(expression, expr.Env(env))
	if err != nil {
		return nil, fmt.Errorf("transform node: failed to compile expression: %w", err)
	}

	result, err := expr.Run(program, env)
	if err != nil {
		return nil, fmt.Errorf("transform node: failed to evaluate expression: %w", err)
	}

	output := map[string]interface{}{
		"result": result,
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
