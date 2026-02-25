package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"eflo/backend/engine"
	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
)

type RedisSubHandler struct {
	Repo       *repository.RedisSubscriptionRepo
	Subscriber *engine.RedisSubscriber
}

func (h *RedisSubHandler) List(w http.ResponseWriter, r *http.Request) {
	subs, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, subs)
}

func (h *RedisSubHandler) Create(w http.ResponseWriter, r *http.Request) {
	var s models.RedisSubscription
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if s.Channel == "" {
		http.Error(w, "channel is required", http.StatusBadRequest)
		return
	}

	id, err := h.Repo.Create(&s)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	s.ID = id

	// If enabled, start listening immediately
	if s.Enabled && h.Subscriber != nil {
		if err := h.Subscriber.AddSubscription(s.ID, s.WorkflowID, s.ConfigID, s.Channel, s.IsPattern); err != nil {
			http.Error(w, "subscription created but failed to start listener: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, http.StatusCreated, s)
}

func (h *RedisSubHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	s, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "subscription not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *RedisSubHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var s models.RedisSubscription
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	s.ID = id

	if err := h.Repo.Update(&s); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Sync with live subscriber
	if h.Subscriber != nil {
		if s.Enabled {
			_ = h.Subscriber.AddSubscription(s.ID, s.WorkflowID, s.ConfigID, s.Channel, s.IsPattern)
		} else {
			h.Subscriber.RemoveSubscription(s.ID)
		}
	}

	writeJSON(w, http.StatusOK, s)
}

func (h *RedisSubHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	if h.Subscriber != nil {
		h.Subscriber.RemoveSubscription(id)
	}

	if err := h.Repo.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
