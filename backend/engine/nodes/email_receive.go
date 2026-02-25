package nodes

import (
	"context"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// EmailReceiveNode acts as a trigger entry point. When the flow runs
// (triggered by the EmailPoller service), it passes along the email data.
type EmailReceiveNode struct{}

func (n *EmailReceiveNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	output := map[string]interface{}{
		"triggered":   true,
		"triggeredAt": time.Now().Format(time.RFC3339),
	}

	for k, v := range input {
		output[k] = v
	}

	if _, ok := output["subject"]; !ok {
		output["subject"] = "(manual trigger — no email data)"
	}

	return output, nil
}
