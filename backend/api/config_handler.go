package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type ConfigHandler struct {
	Repo *repository.NodeConfigRepo
}

func (h *ConfigHandler) List(w http.ResponseWriter, r *http.Request) {
	configType := r.URL.Query().Get("type")
	var (
		configs []*models.NodeConfig
		err     error
	)
	if configType != "" {
		configs, err = h.Repo.ListByType(configType)
	} else {
		configs, err = h.Repo.List()
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, configs)
}

func (h *ConfigHandler) Create(w http.ResponseWriter, r *http.Request) {
	var c models.NodeConfig
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	id, err := h.Repo.Create(&c)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	c.ID = id
	writeJSON(w, http.StatusCreated, c)
}

func (h *ConfigHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	c, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "config not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *ConfigHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var c models.NodeConfig
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	c.ID = id
	if err := h.Repo.Update(&c); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (h *ConfigHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
