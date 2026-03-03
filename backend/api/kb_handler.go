package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type KBHandler struct {
	Repo *repository.KBArticleRepo
}

func (h *KBHandler) List(w http.ResponseWriter, r *http.Request) {
	spaceKey := r.URL.Query().Get("space")
	if spaceKey == "" {
		spaceKey = "main"
	}
	var parentID *int64
	if p := r.URL.Query().Get("parentId"); p != "" {
		id, err := strconv.ParseInt(p, 10, 64)
		if err == nil {
			parentID = &id
		}
	}
	list, err := h.Repo.List(spaceKey, parentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *KBHandler) ListAll(w http.ResponseWriter, r *http.Request) {
	spaceKey := r.URL.Query().Get("space")
	if spaceKey == "" {
		spaceKey = "main"
	}
	list, err := h.Repo.ListAll(spaceKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *KBHandler) Search(w http.ResponseWriter, r *http.Request) {
	spaceKey := r.URL.Query().Get("space")
	if spaceKey == "" {
		spaceKey = "main"
	}
	q := r.URL.Query().Get("q")
	if q == "" {
		writeJSON(w, http.StatusOK, []interface{}{})
		return
	}
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}
	list, err := h.Repo.Search(spaceKey, q, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *KBHandler) Create(w http.ResponseWriter, r *http.Request) {
	var a models.KBArticle
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if a.SpaceKey == "" {
		a.SpaceKey = "main"
	}
	id, err := h.Repo.Create(&a)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	a.ID = id
	writeJSON(w, http.StatusCreated, a)
}

func (h *KBHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	a, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "article not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *KBHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	var a models.KBArticle
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	a.ID = id
	if a.SpaceKey == "" {
		a.SpaceKey = "main"
	}
	if err := h.Repo.Update(&a); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *KBHandler) Delete(w http.ResponseWriter, r *http.Request) {
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
