package models

import "time"

// NodeConfig represents a reusable configuration (e.g. Redis server, database connection).
// Nodes reference a config by its ID so connection details are stored once and reused.
type NodeConfig struct {
	ID        int64                  `json:"id"`
	Name      string                 `json:"name"`
	Type      string                 `json:"type"`   // e.g. "redis", "mysql", "mqtt"
	Config    map[string]interface{} `json:"config"` // connection details
	CreatedAt time.Time              `json:"createdAt"`
	UpdatedAt time.Time              `json:"updatedAt"`
}
