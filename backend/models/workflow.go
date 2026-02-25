package models

import "time"

// NodeDef represents a single node in the workflow definition.
type NodeDef struct {
	ID         string                 `json:"id"`
	Type       string                 `json:"type"`
	Label      string                 `json:"label"`
	PositionX  float64                `json:"positionX"`
	PositionY  float64                `json:"positionY"`
	Properties map[string]interface{} `json:"properties,omitempty"`
}

// EdgeDef represents a connection between two nodes.
type EdgeDef struct {
	ID           string `json:"id"`
	Source       string `json:"source"`
	Target       string `json:"target"`
	SourceHandle string `json:"sourceHandle,omitempty"`
	TargetHandle string `json:"targetHandle,omitempty"`
	Label        string `json:"label,omitempty"`
}

// WorkflowDefinition is the JSON structure stored in the definition column.
type WorkflowDefinition struct {
	Nodes []NodeDef `json:"nodes"`
	Edges []EdgeDef `json:"edges"`
}

// Workflow represents a row in the workflows table.
type Workflow struct {
	ID          int64               `json:"id"`
	Name        string              `json:"name"`
	Description string              `json:"description"`
	Definition  *WorkflowDefinition `json:"definition"`
	CreatedAt   time.Time           `json:"createdAt"`
	UpdatedAt   time.Time           `json:"updatedAt"`
}
