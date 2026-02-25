package nodes

import (
	"context"
	"fmt"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"

	"github.com/robfig/cron/v3"
)

type CronNode struct{}

func (n *CronNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	expression, _ := node.Properties["expression"].(string)
	if expression == "" {
		expression = "* * * * *" // default: every minute
	}

	// Validate the cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
	schedule, err := parser.Parse(expression)
	if err != nil {
		return nil, fmt.Errorf("cron node: invalid expression %q: %w", expression, err)
	}

	now := time.Now()
	nextRun := schedule.Next(now)

	timezone, _ := node.Properties["timezone"].(string)
	if timezone == "" {
		timezone = "UTC"
	}

	payload, _ := node.Properties["payload"].(string)

	output := map[string]interface{}{
		"triggered":   true,
		"expression":  expression,
		"timezone":    timezone,
		"triggeredAt": now.Format(time.RFC3339),
		"nextRun":     nextRun.Format(time.RFC3339),
	}

	if payload != "" {
		output["payload"] = payload
	}

	// Forward input data
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}

	return output, nil
}
