package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type FolderHandler struct {
	Repo *repository.FolderRepo
}

func (h *FolderHandler) List(w http.ResponseWriter, r *http.Request) {
	folders, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, folders)
}

func (h *FolderHandler) Create(w http.ResponseWriter, r *http.Request) {
	var f models.WorkflowFolder
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	id, err := h.Repo.Create(&f)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	f.ID = id
	writeJSON(w, http.StatusCreated, f)
}

func (h *FolderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	f, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "folder not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, f)
}

func (h *FolderHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var f models.WorkflowFolder
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	f.ID = id
	if err := h.Repo.Update(&f); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, f)
}

func (h *FolderHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
