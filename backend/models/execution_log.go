package models

import "time"

type ExecutionLog struct {
	ID          int64     `json:"id"`
	ExecutionID int64     `json:"executionId"`
	NodeID      string    `json:"nodeId"`
	NodeType    string    `json:"nodeType"`
	Status      string    `json:"status"`
	Input       string    `json:"input,omitempty"`
	Output      string    `json:"output,omitempty"`
	Error       string    `json:"error,omitempty"`
	ExecutedAt  time.Time `json:"executedAt"`
}
