package nodes

import (
	"context"
	"eflo/backend/engine"
	"fmt"

	"eflo/backend/models"

	"github.com/expr-lang/expr"
)

type ConditionNode struct{}

func (n *ConditionNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	expression, _ := node.Properties["expression"].(string)
	if expression == "" {
		return nil, fmt.Errorf("condition node: expression is required")
	}

	// Evaluate expression with input as environment
	env := map[string]interface{}{}
	for k, v := range input {
		env[k] = v
	}

	program, err := expr.Compile(expression, expr.Env(env))
	if err != nil {
		return nil, fmt.Errorf("condition node: failed to compile expression: %w", err)
	}

	result, err := expr.Run(program, env)
	if err != nil {
		return nil, fmt.Errorf("condition node: failed to evaluate expression: %w", err)
	}

	branch := "false"
	if b, ok := result.(bool); ok && b {
		branch = "true"
	}

	output := map[string]interface{}{
		"_branch": branch,
		"result":  result,
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
