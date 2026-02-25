package nodes

import (
	"context"
	"eflo/backend/engine"
	"fmt"
	"time"

	"eflo/backend/models"
)

type DelayNode struct{}

func (n *DelayNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	durationMs, _ := node.Properties["durationMs"].(float64)
	if durationMs <= 0 {
		durationMs = 1000 // default 1 second
	}

	d := time.Duration(durationMs) * time.Millisecond

	select {
	case <-time.After(d):
		// completed
	case <-ctx.Done():
		return nil, fmt.Errorf("delay node cancelled")
	}

	output := map[string]interface{}{
		"delayed": true,
		"delayMs": durationMs,
	}
	for k, v := range input {
		output[k] = v
	}
	return output, nil
}
