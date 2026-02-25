package engine

import (
	"context"
	"log"
	"sync"
	"time"

	"eflo/backend/repository"

	"github.com/robfig/cron/v3"
)

// Scheduler manages cron-based workflow executions.
type Scheduler struct {
	engine       *Engine
	workflowRepo *repository.WorkflowRepo
	cronRepo     *repository.CronScheduleRepo
	cron         *cron.Cron
	mu           sync.Mutex
	entryMap     map[int64]cron.EntryID // scheduleID -> cron entryID
}

// NewScheduler creates a new cron scheduler.
func NewScheduler(
	eng *Engine,
	workflowRepo *repository.WorkflowRepo,
	cronRepo *repository.CronScheduleRepo,
) *Scheduler {
	return &Scheduler{
		engine:       eng,
		workflowRepo: workflowRepo,
		cronRepo:     cronRepo,
		cron:         cron.New(cron.WithParser(cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor))),
		entryMap:     make(map[int64]cron.EntryID),
	}
}

// Start loads all enabled schedules from DB and starts the cron runner.
func (s *Scheduler) Start() error {
	schedules, err := s.cronRepo.ListEnabled()
	if err != nil {
		return err
	}

	for _, sched := range schedules {
		if err := s.addSchedule(sched.ID, sched.WorkflowID, sched.Expression); err != nil {
			log.Printf("[Scheduler] Failed to add schedule %d: %v", sched.ID, err)
		}
	}

	s.cron.Start()
	log.Printf("[Scheduler] Started with %d active schedules", len(schedules))
	return nil
}

// Stop gracefully stops the cron scheduler.
func (s *Scheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
	log.Println("[Scheduler] Stopped")
}

// Reload removes all existing entries and reloads from DB.
func (s *Scheduler) Reload() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Remove all existing entries
	for schedID, entryID := range s.entryMap {
		s.cron.Remove(entryID)
		delete(s.entryMap, schedID)
	}

	schedules, err := s.cronRepo.ListEnabled()
	if err != nil {
		return err
	}

	for _, sched := range schedules {
		if err := s.addScheduleNoLock(sched.ID, sched.WorkflowID, sched.Expression); err != nil {
			log.Printf("[Scheduler] Failed to reload schedule %d: %v", sched.ID, err)
		}
	}

	log.Printf("[Scheduler] Reloaded with %d active schedules", len(schedules))
	return nil
}

// AddJob adds a single cron job for a schedule.
func (s *Scheduler) AddJob(scheduleID, workflowID int64, expression string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.addScheduleNoLock(scheduleID, workflowID, expression)
}

// RemoveJob removes a cron job by schedule ID.
func (s *Scheduler) RemoveJob(scheduleID int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if entryID, ok := s.entryMap[scheduleID]; ok {
		s.cron.Remove(entryID)
		delete(s.entryMap, scheduleID)
	}
}

func (s *Scheduler) addSchedule(scheduleID, workflowID int64, expression string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.addScheduleNoLock(scheduleID, workflowID, expression)
}

func (s *Scheduler) addScheduleNoLock(scheduleID, workflowID int64, expression string) error {
	// Remove old entry if exists
	if oldID, ok := s.entryMap[scheduleID]; ok {
		s.cron.Remove(oldID)
		delete(s.entryMap, scheduleID)
	}

	entryID, err := s.cron.AddFunc(expression, func() {
		s.runWorkflow(scheduleID, workflowID)
	})
	if err != nil {
		return err
	}

	s.entryMap[scheduleID] = entryID
	return nil
}

func (s *Scheduler) runWorkflow(scheduleID, workflowID int64) {
	log.Printf("[Scheduler] Triggering workflow %d (schedule %d)", workflowID, scheduleID)

	wf, err := s.workflowRepo.GetByID(workflowID)
	if err != nil {
		log.Printf("[Scheduler] Failed to load workflow %d: %v", workflowID, err)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	execID, err := s.engine.RunWorkflow(ctx, wf)
	now := time.Now()

	if err != nil {
		log.Printf("[Scheduler] Workflow %d execution failed (exec %d): %v", workflowID, execID, err)
	} else {
		log.Printf("[Scheduler] Workflow %d execution completed (exec %d)", workflowID, execID)
	}

	// Calculate next run from the cron entry
	var nextRun *time.Time
	if entryID, ok := s.entryMap[scheduleID]; ok {
		entry := s.cron.Entry(entryID)
		if !entry.Next.IsZero() {
			nextRun = &entry.Next
		}
	}

	_ = s.cronRepo.UpdateLastRun(scheduleID, &now, nextRun)
}
