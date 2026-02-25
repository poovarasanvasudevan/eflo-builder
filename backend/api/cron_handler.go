package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
	"github.com/robfig/cron/v3"
)

type CronHandler struct {
	Repo      *repository.CronScheduleRepo
	Scheduler *engine.Scheduler
}

func (h *CronHandler) List(w http.ResponseWriter, r *http.Request) {
	workflowIDStr := r.URL.Query().Get("workflowId")
	var (
		schedules []*models.CronSchedule
		err       error
	)
	if workflowIDStr != "" {
		wfID, _ := strconv.ParseInt(workflowIDStr, 10, 64)
		schedules, err = h.Repo.GetByWorkflowID(wfID)
	} else {
		schedules, err = h.Repo.List()
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, schedules)
}

func (h *CronHandler) Create(w http.ResponseWriter, r *http.Request) {
	var s models.CronSchedule
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if s.Expression == "" {
		http.Error(w, "expression is required", http.StatusBadRequest)
		return
	}
	if s.Timezone == "" {
		s.Timezone = "UTC"
	}

	// Validate cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
	schedule, err := parser.Parse(s.Expression)
	if err != nil {
		http.Error(w, "invalid cron expression: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Calculate next run
	nextRun := schedule.Next(time.Now())
	s.NextRunAt = &nextRun

	id, err := h.Repo.Create(&s)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	s.ID = id

	// If enabled, add to the live scheduler
	if s.Enabled && h.Scheduler != nil {
		if err := h.Scheduler.AddJob(s.ID, s.WorkflowID, s.Expression); err != nil {
			http.Error(w, "schedule created but failed to activate: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	writeJSON(w, http.StatusCreated, s)
}

func (h *CronHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}
	s, err := h.Repo.GetByID(id)
	if err != nil {
		http.Error(w, "schedule not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func (h *CronHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	var s models.CronSchedule
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	s.ID = id

	if s.Expression == "" {
		http.Error(w, "expression is required", http.StatusBadRequest)
		return
	}
	if s.Timezone == "" {
		s.Timezone = "UTC"
	}

	// Validate cron expression
	parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
	schedule, err := parser.Parse(s.Expression)
	if err != nil {
		http.Error(w, "invalid cron expression: "+err.Error(), http.StatusBadRequest)
		return
	}

	nextRun := schedule.Next(time.Now())
	s.NextRunAt = &nextRun

	if err := h.Repo.Update(&s); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update the live scheduler
	if h.Scheduler != nil {
		if s.Enabled {
			_ = h.Scheduler.AddJob(s.ID, s.WorkflowID, s.Expression)
		} else {
			h.Scheduler.RemoveJob(s.ID)
		}
	}

	writeJSON(w, http.StatusOK, s)
}

func (h *CronHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	// Remove from live scheduler first
	if h.Scheduler != nil {
		h.Scheduler.RemoveJob(id)
	}

	if err := h.Repo.Delete(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
