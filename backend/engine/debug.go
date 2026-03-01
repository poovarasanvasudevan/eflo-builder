package engine

import "time"

// DebugEvent is sent over SSE during a debug run for real-time timeline UI.
type DebugEvent struct {
	ExecutionID int64     `json:"executionId"`
	Event       string    `json:"event"` // "started" | "node" | "finished"
	NodeID      string    `json:"nodeId,omitempty"`
	NodeType    string    `json:"nodeType,omitempty"`
	NodeLabel   string    `json:"nodeLabel,omitempty"`
	Status      string    `json:"status"` // "running" | "success" | "error" | "completed" | "failed"
	Input       string    `json:"input,omitempty"`
	Output      string    `json:"output,omitempty"`
	Error       string    `json:"error,omitempty"`
	ExecutedAt  time.Time `json:"executedAt"`
}
