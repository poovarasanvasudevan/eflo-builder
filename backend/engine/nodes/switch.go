package nodes

import (
	"context"
	"fmt"

	"eflo/backend/engine"
	"eflo/backend/models"

	"github.com/expr-lang/expr"
)

// SwitchNode evaluates an expression and routes to one of multiple named branches.
// Each case is defined in properties.cases as:
//
//	[{ "label": "case1", "value": "value1" }, { "label": "case2", "value": "value2" }]
//
// The expression result is matched against case values. If no match, routes to "default".
type SwitchNode struct{}

func (n *SwitchNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	expression, _ := node.Properties["expression"].(string)
	if expression == "" {
		return nil, fmt.Errorf("switch node: 'expression' is required")
	}

	// Evaluate expression
	env := map[string]interface{}{}
	for k, v := range input {
		env[k] = v
	}

	program, err := expr.Compile(expression, expr.Env(env))
	if err != nil {
		return nil, fmt.Errorf("switch node: failed to compile expression: %w", err)
	}

	result, err := expr.Run(program, env)
	if err != nil {
		return nil, fmt.Errorf("switch node: failed to evaluate expression: %w", err)
	}

	resultStr := fmt.Sprintf("%v", result)

	// Parse cases
	cases, _ := node.Properties["cases"].([]interface{})
	matchedBranch := "default"

	for _, c := range cases {
		caseMap, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		caseValue := fmt.Sprintf("%v", caseMap["value"])
		caseLabel, _ := caseMap["label"].(string)
		if caseLabel == "" {
			caseLabel = caseValue
		}
		if caseValue == resultStr {
			matchedBranch = caseLabel
			break
		}
	}

	output := map[string]interface{}{
		"_branch":    matchedBranch,
		"result":     result,
		"resultStr":  resultStr,
		"expression": expression,
		"matched":    matchedBranch != "default",
	}
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}
	return output, nil
}
