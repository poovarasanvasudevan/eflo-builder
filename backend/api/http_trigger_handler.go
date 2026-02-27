package api

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"eflo/backend/engine"
	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type HttpTriggerHandler struct {
	Repo         *repository.HttpTriggerRepo
	WorkflowRepo *repository.WorkflowRepo
	Engine       *engine.Engine
}

func (h *HttpTriggerHandler) List(w http.ResponseWriter, r *http.Request) {
	triggers, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, triggers)
}

func (h *HttpTriggerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var t models.HttpTrigger
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if t.Path == "" {
		http.Error(w, "path is required", http.StatusBadRequest)
		return
	}
	t.Path = strings.TrimPrefix(strings.TrimPrefix(t.Path, "/"), "/api/in/")
	if t.Method == "" {
		t.Method = "POST"
	}

	id, err := h.Repo.Create(&t)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	t.ID = id
	writeJSON(w, http.StatusCreated, t)
}

func (h *HttpTriggerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	t, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "trigger not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *HttpTriggerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var t models.HttpTrigger
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	t.ID = id
	if t.Path != "" {
		t.Path = strings.TrimPrefix(strings.TrimPrefix(t.Path, "/"), "/api/in/")
	}
	if t.Method == "" {
		t.Method = "POST"
	}
	if err := h.Repo.Update(&t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (h *HttpTriggerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	if err := h.Repo.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// HandleHTTPIn is the catch-all handler for /api/in/*. It looks up the trigger by path and method,
// builds input from the request (body, headers, query), and runs the workflow; http_out node sends the response.
func (h *HttpTriggerHandler) HandleHTTPIn(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/in")
	path = strings.TrimPrefix(path, "/")
	if path == "" {
		path = "/"
	}

	method := r.Method
	trigger, err := h.Repo.FindByPathAndMethod(path, method)
	if err != nil || trigger == nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}

	wf, err := h.WorkflowRepo.GetByID(trigger.WorkflowID)
	if err != nil || wf == nil {
		http.Error(w, "workflow not found", http.StatusInternalServerError)
		return
	}

	// Build input from request: body (JSON), query params, headers
	input := make(map[string]interface{})
	input["method"] = r.Method
	input["path"] = path
	input["query"] = r.URL.Query()

	headers := make(map[string]string)
	for k, v := range r.Header {
		if len(v) > 0 {
			headers[k] = v[0]
		}
	}
	input["headers"] = headers

	if r.Body != nil {
		body, _ := io.ReadAll(r.Body)
		if len(body) > 0 {
			var jsonBody interface{}
			if err := json.Unmarshal(body, &jsonBody); err == nil {
				input["payload"] = jsonBody
				input["body"] = jsonBody
			} else {
				input["body"] = string(body)
				input["payload"] = string(body)
			}
		}
	}

	execID, responseSent, err := h.Engine.RunWorkflowForHTTP(r.Context(), wf, input, w)
	if err != nil {
		if !responseSent {
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
				"error":       err.Error(),
				"executionId": execID,
			})
		}
		return
	}
	if !responseSent {
		w.WriteHeader(http.StatusNoContent)
	}
}
