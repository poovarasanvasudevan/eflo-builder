package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type WorkflowHandler struct {
	Repo *repository.WorkflowRepo
}

func (h *WorkflowHandler) List(w http.ResponseWriter, r *http.Request) {
	workflows, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, workflows)
}

func (h *WorkflowHandler) Create(w http.ResponseWriter, r *http.Request) {
	var wf models.Workflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	id, err := h.Repo.Create(&wf)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	wf.ID = id
	writeJSON(w, http.StatusCreated, wf)
}

func (h *WorkflowHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	wf, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "workflow not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, wf)
}

func (h *WorkflowHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var wf models.Workflow
	if err := json.NewDecoder(r.Body).Decode(&wf); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	wf.ID = id
	if err := h.Repo.Update(&wf); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, wf)
}

func (h *WorkflowHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

func (h *WorkflowHandler) Export(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	wf, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "workflow not found", http.StatusNotFound)
		return
	}

	exportData := map[string]interface{}{
		"name":        wf.Name,
		"description": wf.Description,
		"definition":  wf.Definition,
		"exportedAt":  wf.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=\""+wf.Name+".json\"")
	json.NewEncoder(w).Encode(exportData)
}

func (h *WorkflowHandler) Import(w http.ResponseWriter, r *http.Request) {
	var importData struct {
		Name        string                     `json:"name"`
		Description string                     `json:"description"`
		Definition  *models.WorkflowDefinition `json:"definition"`
	}
	if err := json.NewDecoder(r.Body).Decode(&importData); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	wf := &models.Workflow{
		Name:        importData.Name,
		Description: importData.Description,
		Definition:  importData.Definition,
	}
	id, err := h.Repo.Create(wf)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	wf.ID = id
	writeJSON(w, http.StatusCreated, wf)
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
