package models

import "time"

// RedisSubscription represents a Redis pub/sub subscription that triggers a workflow.
type RedisSubscription struct {
	ID         int64      `json:"id"`
	WorkflowID int64      `json:"workflowId"`
	ConfigID   int64      `json:"configId"`  // references node_configs (type=redis)
	Channel    string     `json:"channel"`   // channel name or pattern
	IsPattern  bool       `json:"isPattern"` // true = PSUBSCRIBE, false = SUBSCRIBE
	Enabled    bool       `json:"enabled"`
	LastMsgAt  *time.Time `json:"lastMsgAt,omitempty"`
	MsgCount   int64      `json:"msgCount"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}
