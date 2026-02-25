package models

import "time"

type Execution struct {
	ID         int64      `json:"id"`
	WorkflowID int64      `json:"workflowId"`
	Status     string     `json:"status"`
	StartedAt  *time.Time `json:"startedAt,omitempty"`
	FinishedAt *time.Time `json:"finishedAt,omitempty"`
	Error      string     `json:"error,omitempty"`
}
