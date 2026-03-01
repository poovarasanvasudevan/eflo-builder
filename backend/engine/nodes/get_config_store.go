package nodes

import (
	"context"
	"fmt"

	"eflo/backend/engine"
	"eflo/backend/models"
)

type GetConfigStoreNode struct{}

func (n *GetConfigStoreNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	store := engine.ConfigStoreFromContext(ctx)
	if store == nil {
		return nil, fmt.Errorf("get_config_store: config store not available")
	}
	key, _ := node.Properties["key"].(string)
	if key == "" {
		return nil, fmt.Errorf("get_config_store: key is required")
	}
	value, ok, err := store.Get(key)
	if err != nil {
		return nil, fmt.Errorf("get_config_store: %w", err)
	}
	if !ok {
		return nil, fmt.Errorf("get_config_store: key %q not found", key)
	}
	return map[string]interface{}{
		"value": value,
		"key":   key,
	}, nil
}
