package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"eflo/backend/engine"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

const defaultStatsDays = 14

type ExecutionHandler struct {
	WorkflowRepo *repository.WorkflowRepo
	ExecRepo     *repository.ExecutionRepo
	ExecLogRepo  *repository.ExecutionLogRepo
	Engine       *engine.Engine
}

func (h *ExecutionHandler) Execute(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	wf, err := h.WorkflowRepo.GetByID(id)
	if err != nil {
		http.Error(w, "workflow not found", http.StatusNotFound)
		return
	}

	execID, err := h.Engine.RunWorkflow(r.Context(), wf)
	if err != nil {
		// Return the execution ID even on failure so user can see logs
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"executionId": execID,
			"status":      "failed",
			"error":       err.Error(),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"executionId": execID,
		"status":      "completed",
	})
}

func (h *ExecutionHandler) ListByWorkflow(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	executions, err := h.ExecRepo.ListByWorkflow(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, executions)
}

func (h *ExecutionHandler) GetExecution(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	exec, err := h.ExecRepo.GetByID(id)
	if err != nil {
		http.Error(w, "execution not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, exec)
}

func (h *ExecutionHandler) GetExecutionLogs(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	logs, err := h.ExecLogRepo.ListByExecution(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, logs)
}

// statsResponse is the JSON response for GET /api/stats/executions.
type statsResponse struct {
	TotalCount        int64                     `json:"totalCount"`
	TotalDurationSec  float64                   `json:"totalDurationSec"`
	AvgDurationSec    float64                   `json:"avgDurationSec"`
	MinDurationSec    float64                   `json:"minDurationSec"`
	MaxDurationSec    float64                   `json:"maxDurationSec"`
	ByDay             []repository.DayStat      `json:"byDay"`
}

func (h *ExecutionHandler) Stats(w http.ResponseWriter, r *http.Request) {
	global, err := h.ExecRepo.GetGlobalStats()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	days := defaultStatsDays
	if d := r.URL.Query().Get("days"); d != "" {
		if n, err := strconv.Atoi(d); err == nil && n > 0 && n <= 90 {
			days = n
		}
	}
	byDay, err := h.ExecRepo.GetStatsByDay(days)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	resp := statsResponse{
		TotalCount:       global.TotalCount,
		TotalDurationSec: global.TotalDuration,
		AvgDurationSec:   global.AvgDuration,
		MinDurationSec:   global.MinDuration,
		MaxDurationSec:   global.MaxDuration,
		ByDay:            byDay,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// ExecuteDebug runs the workflow and streams real-time execution events via Server-Sent Events (SSE).
func (h *ExecutionHandler) ExecuteDebug(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	wf, err := h.WorkflowRepo.GetByID(id)
	if err != nil {
		http.Error(w, "workflow not found", http.StatusNotFound)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	events := make(chan engine.DebugEvent, 32)
	go func() {
		defer close(events)
		_, _ = h.Engine.RunWorkflowWithInput(r.Context(), wf, nil, nil, events)
	}()

	enc := json.NewEncoder(w)
	for ev := range events {
		if _, err := w.Write([]byte("data: ")); err != nil {
			return
		}
		if err := enc.Encode(ev); err != nil {
			return
		}
		if _, err := w.Write([]byte("\n")); err != nil {
			return
		}
		flusher.Flush()
	}
}
