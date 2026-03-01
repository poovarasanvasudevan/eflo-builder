package api

import (
	"encoding/json"
	"net/http"

	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type ConfigStoreHandler struct {
	Repo *repository.ConfigStoreRepo
}

func (h *ConfigStoreHandler) List(w http.ResponseWriter, r *http.Request) {
	entries, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Mask values in list response for security (show only key + description)
	type masked struct {
		Key         string `json:"key"`
		Value       string `json:"value"` // masked as ********
		Description string `json:"description,omitempty"`
		CreatedAt   string `json:"createdAt"`
		UpdatedAt   string `json:"updatedAt"`
	}
	out := make([]masked, len(entries))
	for i, e := range entries {
		val := ""
		if len(e.Value) > 0 {
			val = "********"
		}
		out[i] = masked{
			Key:         e.Key,
			Value:       val,
			Description: e.Description,
			CreatedAt:   e.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   e.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *ConfigStoreHandler) Get(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	if key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}
	entry, err := h.Repo.GetEntry(key)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if entry == nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, entry)
}

func (h *ConfigStoreHandler) Set(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Key         string `json:"key"`
		Value       string `json:"value"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if body.Key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}
	if err := h.Repo.Set(body.Key, body.Value, body.Description); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"key": body.Key, "status": "ok"})
}

func (h *ConfigStoreHandler) Delete(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	if key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}
	if err := h.Repo.Delete(key); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListFull returns all entries with values (for admin/export). Use with care.
func (h *ConfigStoreHandler) ListFull(w http.ResponseWriter, r *http.Request) {
	entries, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, entries)
}

// CreateOrUpdate accepts a single entry (for the "set" screen / form submit).
func (h *ConfigStoreHandler) CreateOrUpdate(w http.ResponseWriter, r *http.Request) {
	var e models.ConfigStoreEntry
	if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if e.Key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}
	if err := h.Repo.Set(e.Key, e.Value, e.Description); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	e.Value = "" // do not echo secret back
	writeJSON(w, http.StatusOK, e)
}
