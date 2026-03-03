package models

import "time"

// WorkflowFolder represents a folder in the flow tree.
type WorkflowFolder struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	ParentID  *int64    `json:"parentId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
