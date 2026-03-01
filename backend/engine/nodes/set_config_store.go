package nodes

import (
	"context"
	"fmt"

	"eflo/backend/engine"
	"eflo/backend/models"
)

type SetConfigStoreNode struct{}

func (n *SetConfigStoreNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	store := engine.ConfigStoreFromContext(ctx)
	if store == nil {
		return nil, fmt.Errorf("set_config_store: config store not available")
	}
	key, _ := node.Properties["key"].(string)
	if key == "" {
		return nil, fmt.Errorf("set_config_store: key is required")
	}
	// Value: from node property first, else from input["value"]
	value, _ := node.Properties["value"].(string)
	if value == "" {
		if v, ok := input["value"]; ok {
			switch t := v.(type) {
			case string:
				value = t
			default:
				value = fmt.Sprintf("%v", t)
			}
		}
	}
	description, _ := node.Properties["description"].(string)
	if err := store.Set(key, value, description); err != nil {
		return nil, fmt.Errorf("set_config_store: %w", err)
	}
	// Pass through input and add key/ok
	out := map[string]interface{}{}
	for k, v := range input {
		out[k] = v
	}
	out["_config_store_key"] = key
	out["_config_store_set"] = true
	return out, nil
}
