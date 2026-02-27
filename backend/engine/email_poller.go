package engine

import (
	"context"
	"log"
	"sync"
	"time"

	"eflo/backend/imaputil"
	"eflo/backend/repository"
)

// EmailPoller periodically checks IMAP mailboxes and triggers workflows for new emails.
type EmailPoller struct {
	engine       *Engine
	workflowRepo *repository.WorkflowRepo
	configRepo   *repository.NodeConfigRepo
	triggerRepo  *repository.EmailTriggerRepo
	mu           sync.Mutex
	cancels      map[int64]context.CancelFunc // triggerID -> cancel func
	wg           sync.WaitGroup
}

func NewEmailPoller(
	eng *Engine,
	workflowRepo *repository.WorkflowRepo,
	configRepo *repository.NodeConfigRepo,
	triggerRepo *repository.EmailTriggerRepo,
) *EmailPoller {
	return &EmailPoller{
		engine:       eng,
		workflowRepo: workflowRepo,
		configRepo:   configRepo,
		triggerRepo:  triggerRepo,
		cancels:      make(map[int64]context.CancelFunc),
	}
}

func (ep *EmailPoller) Start() error {
	triggers, err := ep.triggerRepo.ListEnabled()
	if err != nil {
		return err
	}
	for _, t := range triggers {
		if err := ep.startPoller(t.ID, t.WorkflowID, t.ConfigID, t.Mailbox, t.PollIntervalSec, t.MarkSeen, t.MaxFetch); err != nil {
			log.Printf("[EmailPoller] Failed to start trigger %d: %v", t.ID, err)
		}
	}
	log.Printf("[EmailPoller] Started with %d active triggers", len(triggers))
	return nil
}

func (ep *EmailPoller) Stop() {
	ep.mu.Lock()
	for id, cancel := range ep.cancels {
		cancel()
		delete(ep.cancels, id)
	}
	ep.mu.Unlock()
	ep.wg.Wait()
	log.Println("[EmailPoller] Stopped")
}

func (ep *EmailPoller) AddTrigger(triggerID, workflowID, configID int64, mailbox string, intervalSec int, markSeen bool, maxFetch int) error {
	return ep.startPoller(triggerID, workflowID, configID, mailbox, intervalSec, markSeen, maxFetch)
}

func (ep *EmailPoller) RemoveTrigger(triggerID int64) {
	ep.mu.Lock()
	defer ep.mu.Unlock()
	if cancel, ok := ep.cancels[triggerID]; ok {
		cancel()
		delete(ep.cancels, triggerID)
	}
}

func (ep *EmailPoller) startPoller(triggerID, workflowID, configID int64, mailbox string, intervalSec int, markSeen bool, maxFetch int) error {
	ep.RemoveTrigger(triggerID)

	if intervalSec < 10 {
		intervalSec = 60
	}
	if maxFetch <= 0 {
		maxFetch = 10
	}

	ctx, cancel := context.WithCancel(context.Background())
	ep.mu.Lock()
	ep.cancels[triggerID] = cancel
	ep.mu.Unlock()

	ep.wg.Add(1)
	go func() {
		defer ep.wg.Done()

		ticker := time.NewTicker(time.Duration(intervalSec) * time.Second)
		defer ticker.Stop()

		log.Printf("[EmailPoller] Polling every %ds for trigger %d (workflow %d, mailbox=%s)", intervalSec, triggerID, workflowID, mailbox)

		// Do an initial poll immediately
		ep.poll(triggerID, workflowID, configID, mailbox, markSeen, uint32(maxFetch))

		for {
			select {
			case <-ctx.Done():
				log.Printf("[EmailPoller] Stopped trigger %d", triggerID)
				return
			case <-ticker.C:
				ep.poll(triggerID, workflowID, configID, mailbox, markSeen, uint32(maxFetch))
			}
		}
	}()

	return nil
}

func (ep *EmailPoller) poll(triggerID, workflowID, configID int64, mailbox string, markSeen bool, maxFetch uint32) {
	cfg, err := ep.configRepo.GetByID(configID)
	if err != nil {
		log.Printf("[EmailPoller] Failed to resolve config %d: %v", configID, err)
		return
	}

	emails, err := imaputil.FetchNewEmails(cfg, mailbox, markSeen, maxFetch)
	if err != nil {
		log.Printf("[EmailPoller] Fetch failed for trigger %d: %v", triggerID, err)
		return
	}

	if len(emails) == 0 {
		return
	}

	log.Printf("[EmailPoller] Found %d new email(s) for trigger %d", len(emails), triggerID)

	wf, err := ep.workflowRepo.GetByID(workflowID)
	if err != nil {
		log.Printf("[EmailPoller] Failed to load workflow %d: %v", workflowID, err)
		return
	}

	for _, emailData := range emails {
		emailData["triggerId"] = triggerID
		emailData["receivedAt"] = time.Now().Format(time.RFC3339)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		execID, err := ep.engine.RunWorkflowWithInput(ctx, wf, emailData, nil)
		cancel()

		_ = ep.triggerRepo.IncrementMsgCount(triggerID)

		if err != nil {
			log.Printf("[EmailPoller] Workflow %d exec failed (exec %d): %v", workflowID, execID, err)
		} else {
			log.Printf("[EmailPoller] Workflow %d exec completed (exec %d) for email: %s", workflowID, execID, emailData["subject"])
		}
	}
}
