package nodes

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// FlowNode executes another workflow (sub-flow) from within a workflow.
// It looks up the target workflow by ID, runs it with the current input,
// and returns the sub-flow execution ID and status.
type FlowNode struct {
	resolveWorkflow engine.WorkflowResolver
	runSubFlow      engine.SubFlowRunner
}

func (n *FlowNode) SetSubFlowDeps(resolver engine.WorkflowResolver, runner engine.SubFlowRunner) {
	n.resolveWorkflow = resolver
	n.runSubFlow = runner
}

func (n *FlowNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	// Get workflow_id from properties
	var workflowID int64

	switch v := node.Properties["workflow_id"].(type) {
	case float64:
		workflowID = int64(v)
	case int64:
		workflowID = v
	case int:
		workflowID = int64(v)
	case string:
		parsed, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("flow node: invalid workflow_id '%s': %w", v, err)
		}
		workflowID = parsed
	default:
		return nil, fmt.Errorf("flow node: 'workflow_id' is required")
	}

	if workflowID == 0 {
		return nil, fmt.Errorf("flow node: 'workflow_id' is required")
	}

	if n.resolveWorkflow == nil || n.runSubFlow == nil {
		return nil, fmt.Errorf("flow node: sub-flow dependencies not injected")
	}

	// Resolve the target workflow
	workflow, err := n.resolveWorkflow(workflowID)
	if err != nil {
		return nil, fmt.Errorf("flow node: failed to resolve workflow %d: %w", workflowID, err)
	}

	// Check for pass_input property — if true, forward current input to sub-flow
	passInput, _ := node.Properties["pass_input"].(bool)
	var subInput map[string]interface{}
	if passInput {
		subInput = make(map[string]interface{})
		for k, v := range input {
			subInput[k] = v
		}
	}

	// Run the sub-flow
	startTime := time.Now()
	subExecID, err := n.runSubFlow(ctx, workflow, subInput)
	duration := time.Since(startTime).Milliseconds()

	status := "completed"
	errMsg := ""
	if err != nil {
		status = "failed"
		errMsg = err.Error()
	}

	output := map[string]interface{}{
		"subflow_execution_id": subExecID,
		"subflow_workflow_id":  workflowID,
		"subflow_name":         workflow.Name,
		"subflow_status":       status,
		"subflow_duration_ms":  duration,
	}

	if errMsg != "" {
		output["subflow_error"] = errMsg
	}

	// Forward input data
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}

	if err != nil {
		return output, fmt.Errorf("flow node: sub-flow %d (%s) failed: %w", workflowID, workflow.Name, err)
	}

	return output, nil
}
