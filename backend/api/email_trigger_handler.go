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

type EmailTriggerHandler struct {
	Repo   *repository.EmailTriggerRepo
	Poller *engine.EmailPoller
}

func (h *EmailTriggerHandler) List(w http.ResponseWriter, r *http.Request) {
	triggers, err := h.Repo.List()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, triggers)
}

func (h *EmailTriggerHandler) Create(w http.ResponseWriter, r *http.Request) {
	var t models.EmailTrigger
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	if t.Mailbox == "" {
		t.Mailbox = "INBOX"
	}
	if t.PollIntervalSec < 10 {
		t.PollIntervalSec = 60
	}
	if t.MaxFetch <= 0 {
		t.MaxFetch = 10
	}

	id, err := h.Repo.Create(&t)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	t.ID = id

	if t.Enabled && h.Poller != nil {
		if err := h.Poller.AddTrigger(t.ID, t.WorkflowID, t.ConfigID, t.Mailbox, t.PollIntervalSec, t.MarkSeen, t.MaxFetch); err != nil {
			http.Error(w, "trigger created but failed to start poller: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, http.StatusCreated, t)
}

func (h *EmailTriggerHandler) GetByID(w http.ResponseWriter, r *http.Request) {
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

func (h *EmailTriggerHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var t models.EmailTrigger
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	t.ID = id

	if err := h.Repo.Update(&t); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if h.Poller != nil {
		if t.Enabled {
			_ = h.Poller.AddTrigger(t.ID, t.WorkflowID, t.ConfigID, t.Mailbox, t.PollIntervalSec, t.MarkSeen, t.MaxFetch)
		} else {
			h.Poller.RemoveTrigger(t.ID)
		}
	}

	writeJSON(w, http.StatusOK, t)
}

func (h *EmailTriggerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	if h.Poller != nil {
		h.Poller.RemoveTrigger(id)
	}

	if err := h.Repo.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
