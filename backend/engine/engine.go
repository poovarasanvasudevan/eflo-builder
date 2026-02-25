package engine

import (
	"context"
	"eflo/backend/models"
	"eflo/backend/repository"
	"encoding/json"
	"fmt"
	"time"
)

type Engine struct {
	ExecRepo     *repository.ExecutionRepo
	ExecLogRepo  *repository.ExecutionLogRepo
	ConfigRepo   *repository.NodeConfigRepo
	WorkflowRepo *repository.WorkflowRepo
}

func NewEngine(execRepo *repository.ExecutionRepo, execLogRepo *repository.ExecutionLogRepo, configRepo *repository.NodeConfigRepo, workflowRepo *repository.WorkflowRepo) *Engine {
	return &Engine{ExecRepo: execRepo, ExecLogRepo: execLogRepo, ConfigRepo: configRepo, WorkflowRepo: workflowRepo}
}

// RunWorkflow executes the workflow synchronously and returns the execution ID.
func (e *Engine) RunWorkflow(ctx context.Context, workflow *models.Workflow) (int64, error) {
	return e.RunWorkflowWithInput(ctx, workflow, nil)
}

// RunWorkflowWithInput executes the workflow with optional initial input injected into the start node.
func (e *Engine) RunWorkflowWithInput(ctx context.Context, workflow *models.Workflow, initialInput map[string]interface{}) (int64, error) {
	def := workflow.Definition
	if def == nil || len(def.Nodes) == 0 {
		return 0, fmt.Errorf("workflow has no nodes")
	}

	// Create execution record
	exec := &models.Execution{
		WorkflowID: workflow.ID,
		Status:     "running",
	}
	execID, err := e.ExecRepo.Create(exec)
	if err != nil {
		return 0, fmt.Errorf("failed to create execution: %w", err)
	}

	// Build adjacency list and node map
	nodeMap := map[string]models.NodeDef{}
	for _, n := range def.Nodes {
		nodeMap[n.ID] = n
	}

	adjacency := map[string][]models.EdgeDef{}
	for _, edge := range def.Edges {
		adjacency[edge.Source] = append(adjacency[edge.Source], edge)
	}

	// Find start node (start, cron, or redis_subscribe nodes can be entry points)
	var startNodeID string
	for _, n := range def.Nodes {
		if n.Type == "start" || n.Type == "cron" || n.Type == "redis_subscribe" || n.Type == "email_receive" {
			startNodeID = n.ID
			break
		}
	}
	if startNodeID == "" {
		_ = e.ExecRepo.Finish(execID, "failed", "no start node found")
		return execID, fmt.Errorf("no start node found")
	}

	// BFS / sequential execution from start node
	visited := map[string]bool{}
	queue := []string{startNodeID}
	nodeOutputs := map[string]map[string]interface{}{}

	// Config resolver allows nodes to look up shared configs (Redis server, etc.)
	resolveConfig := ConfigResolver(func(configID int64) (*models.NodeConfig, error) {
		if e.ConfigRepo == nil {
			return nil, fmt.Errorf("config repo not available")
		}
		return e.ConfigRepo.GetByID(configID)
	})

	var execErr error

	for len(queue) > 0 {
		currentID := queue[0]
		queue = queue[1:]

		if visited[currentID] {
			continue
		}
		visited[currentID] = true

		node, ok := nodeMap[currentID]
		if !ok {
			continue
		}

		executor, ok := Registry[node.Type]
		if !ok {
			execErr = fmt.Errorf("unknown node type: %s", node.Type)
			e.logNode(execID, node, nil, nil, execErr)
			break
		}

		// Inject sub-flow dependencies for nodes that need them (e.g. flow node)
		if sfc, ok := executor.(SubFlowCapable); ok {
			resolver := WorkflowResolver(func(wfID int64) (*models.Workflow, error) {
				if e.WorkflowRepo == nil {
					return nil, fmt.Errorf("workflow repo not available")
				}
				return e.WorkflowRepo.GetByID(wfID)
			})
			runner := SubFlowRunner(func(ctx2 context.Context, wf *models.Workflow, inp map[string]interface{}) (int64, error) {
				return e.RunWorkflowWithInput(ctx2, wf, inp)
			})
			sfc.SetSubFlowDeps(resolver, runner)
		}

		// Gather input from all parent nodes
		input := map[string]interface{}{}

		// If this is the start node and we have initial input, inject it
		if currentID == startNodeID && initialInput != nil {
			for k, v := range initialInput {
				input[k] = v
			}
		}

		for _, edge := range def.Edges {
			if edge.Target == currentID {
				if parentOutput, exists := nodeOutputs[edge.Source]; exists {
					for k, v := range parentOutput {
						input[k] = v
					}
				}
			}
		}

		output, err := executor.Execute(ctx, node, input, resolveConfig)
		if err != nil {
			execErr = fmt.Errorf("node %s (%s) failed: %w", node.ID, node.Type, err)
			e.logNode(execID, node, input, nil, err)
			break
		}

		nodeOutputs[currentID] = output
		e.logNode(execID, node, input, output, nil)

		// For condition/switch nodes, follow the appropriate branch
		if node.Type == "condition" || node.Type == "switch" {
			branchStr, _ := output["_branch"].(string)
			for _, edge := range adjacency[currentID] {
				if edge.SourceHandle == branchStr || edge.Label == branchStr {
					queue = append(queue, edge.Target)
				}
			}
		} else {
			// Follow all outgoing edges
			for _, edge := range adjacency[currentID] {
				queue = append(queue, edge.Target)
			}
		}
	}

	if execErr != nil {
		_ = e.ExecRepo.Finish(execID, "failed", execErr.Error())
		return execID, execErr
	}

	_ = e.ExecRepo.Finish(execID, "completed", "")
	return execID, nil
}

func (e *Engine) logNode(execID int64, node models.NodeDef, input, output map[string]interface{}, execErr error) {
	inputJSON, _ := json.Marshal(input)
	outputJSON, _ := json.Marshal(output)
	status := "success"
	errMsg := ""
	if execErr != nil {
		status = "error"
		errMsg = execErr.Error()
	}
	now := time.Now()
	log := &models.ExecutionLog{
		ExecutionID: execID,
		NodeID:      node.ID,
		NodeType:    node.Type,
		Status:      status,
		Input:       string(inputJSON),
		Output:      string(outputJSON),
		Error:       errMsg,
		ExecutedAt:  now,
	}
	_, _ = e.ExecLogRepo.Create(log)
}
