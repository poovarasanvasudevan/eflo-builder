package engine

import (
	"context"
	"eflo/backend/models"
)

// ConfigResolver resolves a node config by its ID.
type ConfigResolver func(configID int64) (*models.NodeConfig, error)

// WorkflowResolver resolves a workflow by its ID.
type WorkflowResolver func(workflowID int64) (*models.Workflow, error)

// SubFlowRunner executes a sub-workflow with given input and returns the execution ID and any error.
type SubFlowRunner func(ctx context.Context, workflow *models.Workflow, input map[string]interface{}) (int64, error)

// NodeExecutor is the interface every node type must implement.
type NodeExecutor interface {
	// Execute runs the node logic. Input is the data from upstream nodes.
	// Returns output data and an optional error.
	Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, resolveConfig ConfigResolver) (output map[string]interface{}, err error)
}

// SubFlowCapable is an optional interface for nodes that need to execute sub-workflows.
type SubFlowCapable interface {
	SetSubFlowDeps(resolver WorkflowResolver, runner SubFlowRunner)
}

// Registry maps node type strings to their executor implementations.
var Registry = map[string]NodeExecutor{}

// Register adds a node executor to the registry.
func Register(nodeType string, executor NodeExecutor) {
	Registry[nodeType] = executor
}
