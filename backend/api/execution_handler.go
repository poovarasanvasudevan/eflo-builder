package api

import (
	"net/http"
	"strconv"

	"eflo/backend/engine"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

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
