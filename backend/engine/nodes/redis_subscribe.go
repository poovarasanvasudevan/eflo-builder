package nodes

import (
	"context"
	"fmt"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// RedisSubscribeNode acts as a trigger entry point. When the flow runs
// (triggered by the RedisSubscriber service), it passes along the message
// received from the Redis channel.
type RedisSubscribeNode struct{}

func (n *RedisSubscribeNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	channel, _ := node.Properties["channel"].(string)
	pattern, _ := node.Properties["pattern"].(string)

	output := map[string]interface{}{
		"triggered":   true,
		"triggeredAt": time.Now().Format(time.RFC3339),
	}

	if channel != "" {
		output["channel"] = channel
	}
	if pattern != "" {
		output["pattern"] = pattern
	}

	// Forward any input injected by the subscriber service (the actual message)
	for k, v := range input {
		output[k] = v
	}

	// If no message was provided in input (manual run), note it
	if _, ok := output["message"]; !ok {
		output["message"] = fmt.Sprintf("redis_subscribe trigger (channel=%s)", channel)
	}

	return output, nil
}
