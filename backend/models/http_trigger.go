package models

import "time"

// HttpTrigger represents an HTTP endpoint that triggers a workflow (like Node-RED HTTP-in).
// When a request matches the path and method, the workflow runs with request data as input.
type HttpTrigger struct {
	ID         int64     `json:"id"`
	WorkflowID int64     `json:"workflowId"`
	Path       string    `json:"path"`   // e.g. "webhook" or "api/v1/events"
	Method     string    `json:"method"` // GET, POST, PUT, DELETE, etc.
	Enabled    bool      `json:"enabled"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
