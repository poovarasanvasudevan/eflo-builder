package engine

import (
	"context"
	"net/http"

	"eflo/backend/models"
	"eflo/backend/repository"
	"encoding/json"
	"fmt"
	"time"
)

type Engine struct {
	ExecRepo        *repository.ExecutionRepo
	ExecLogRepo     *repository.ExecutionLogRepo
	ConfigRepo      *repository.NodeConfigRepo
	ConfigStoreRepo *repository.ConfigStoreRepo
	WorkflowRepo    *repository.WorkflowRepo
}

func NewEngine(execRepo *repository.ExecutionRepo, execLogRepo *repository.ExecutionLogRepo, configRepo *repository.NodeConfigRepo, configStoreRepo *repository.ConfigStoreRepo, workflowRepo *repository.WorkflowRepo) *Engine {
	return &Engine{ExecRepo: execRepo, ExecLogRepo: execLogRepo, ConfigRepo: configRepo, ConfigStoreRepo: configStoreRepo, WorkflowRepo: workflowRepo}
}

// RunWorkflow executes the workflow synchronously and returns the execution ID.
func (e *Engine) RunWorkflow(ctx context.Context, workflow *models.Workflow) (int64, error) {
	return e.RunWorkflowWithInput(ctx, workflow, nil, nil, nil)
}

// RunWorkflowWithInput executes the workflow with optional initial input injected into the start node.
// If httpRun is non-nil (HTTP-triggered flow), the engine stops when http_out sets response sent.
// If debugSink is non-nil, real-time DebugEvents are sent for the debug UI (SSE).
func (e *Engine) RunWorkflowWithInput(ctx context.Context, workflow *models.Workflow, initialInput map[string]interface{}, httpRun *HttpRun, debugSink chan<- DebugEvent) (int64, error) {
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
	if debugSink != nil {
		e.emitDebug(debugSink, DebugEvent{ExecutionID: execID, Event: "started", Status: "running", ExecutedAt: time.Now()})
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

	// Inject HTTP response into context for http_out node when this is an HTTP-triggered run
	if httpRun != nil {
		ctx = context.WithValue(ctx, httpRunContextKey, httpRun)
	}
	// Inject config store for get_config_store / set_config_store nodes
	if e.ConfigStoreRepo != nil {
		ctx = context.WithValue(ctx, configStoreContextKey, e.ConfigStoreRepo)
	}
	// Load config store as key-value map for config variable (Function node, {{config.xxx}} in HTTP Request, etc.)
	var configMap map[string]interface{}
	if e.ConfigStoreRepo != nil {
		entries, err := e.ConfigStoreRepo.List()
		if err == nil && len(entries) > 0 {
			configMap = make(map[string]interface{}, len(entries))
			for _, entry := range entries {
				configMap[entry.Key] = entry.Value
			}
			ctx = context.WithValue(ctx, configMapContextKey, configMap)
		}
	}

	// Find start node (start, cron, redis_subscribe, email_receive, http_in can be entry points)
	var startNodeID string
	for _, n := range def.Nodes {
		if n.Type == "start" || n.Type == "cron" || n.Type == "redis_subscribe" || n.Type == "email_receive" || n.Type == "http_in" {
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

		node, ok := nodeMap[currentID]
		if !ok {
			continue
		}

		// Continue node: run only after the configured "after_node_id" has executed
		if node.Type == "continue" {
			if afterNodeID, _ := node.Properties["after_node_id"].(string); afterNodeID != "" {
				if !visited[afterNodeID] {
					queue = append(queue, currentID)
					continue
				}
			}
		}

		visited[currentID] = true

		executor, ok := Registry[node.Type]
		if !ok {
			execErr = fmt.Errorf("unknown node type: %s", node.Type)
			e.logNode(execID, node, nil, nil, execErr, debugSink)
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
				return e.RunWorkflowWithInput(ctx2, wf, inp, nil, nil)
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
		// Inject config map so nodes can use config.token / {{config.token}}
		if configMap != nil {
			input["config"] = configMap
		}

		output, err := executor.Execute(ctx, node, input, resolveConfig)
		if err != nil {
			execErr = fmt.Errorf("node %s (%s) failed: %w", node.ID, node.Type, err)
			e.logNode(execID, node, input, nil, err, debugSink)
			break
		}

		nodeOutputs[currentID] = output
		e.logNode(execID, node, input, output, nil, debugSink)

		// If HTTP-out sent the response, stop the flow
		if httpRun != nil && httpRun.Sent != nil && *httpRun.Sent {
			break
		}

		// If a node explicitly requests to stop (e.g. function node with no returnValue), do not follow outgoing edges.
		if stop, ok := output["_stop"].(bool); ok && stop {
			continue
		}

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
		if debugSink != nil {
			e.emitDebug(debugSink, DebugEvent{ExecutionID: execID, Event: "finished", Status: "failed", Error: execErr.Error(), ExecutedAt: time.Now()})
		}
		return execID, execErr
	}

	_ = e.ExecRepo.Finish(execID, "completed", "")
	if debugSink != nil {
		e.emitDebug(debugSink, DebugEvent{ExecutionID: execID, Event: "finished", Status: "completed", ExecutedAt: time.Now()})
	}
	return execID, nil
}

// RunWorkflowForHTTP runs the workflow with request data as input and writes the response via http_out.
// Returns (execID, responseSent, error). If responseSent is false, the handler should send a default response.
func (e *Engine) RunWorkflowForHTTP(ctx context.Context, workflow *models.Workflow, initialInput map[string]interface{}, w http.ResponseWriter) (execID int64, responseSent bool, err error) {
	sent := false
	hr := &HttpRun{W: w, Sent: &sent}
	execID, err = e.RunWorkflowWithInput(ctx, workflow, initialInput, hr, nil)
	return execID, sent, err
}

func (e *Engine) logNode(execID int64, node models.NodeDef, input, output map[string]interface{}, execErr error, debugSink chan<- DebugEvent) {
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
	if debugSink != nil {
		label := node.Label
		if label == "" {
			label = node.ID
		}
		e.emitDebug(debugSink, DebugEvent{
			ExecutionID: execID,
			Event:       "node",
			NodeID:      node.ID,
			NodeType:    node.Type,
			NodeLabel:   label,
			Status:      status,
			Input:       string(inputJSON),
			Output:      string(outputJSON),
			Error:       errMsg,
			ExecutedAt:  now,
		})
	}
}

func (e *Engine) emitDebug(sink chan<- DebugEvent, ev DebugEvent) {
	select {
	case sink <- ev:
	default:
		// non-blocking: skip if consumer is slow
	}
}
