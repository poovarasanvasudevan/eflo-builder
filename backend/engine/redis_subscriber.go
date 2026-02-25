package engine

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"eflo/backend/repository"

	"github.com/redis/go-redis/v9"
)

// RedisSubscriber manages Redis pub/sub listeners that trigger workflow executions.
type RedisSubscriber struct {
	engine       *Engine
	workflowRepo *repository.WorkflowRepo
	configRepo   *repository.NodeConfigRepo
	subRepo      *repository.RedisSubscriptionRepo
	mu           sync.Mutex
	cancels      map[int64]context.CancelFunc // subscriptionID -> cancel func
	wg           sync.WaitGroup
}

// NewRedisSubscriber creates a new Redis subscriber manager.
func NewRedisSubscriber(
	eng *Engine,
	workflowRepo *repository.WorkflowRepo,
	configRepo *repository.NodeConfigRepo,
	subRepo *repository.RedisSubscriptionRepo,
) *RedisSubscriber {
	return &RedisSubscriber{
		engine:       eng,
		workflowRepo: workflowRepo,
		configRepo:   configRepo,
		subRepo:      subRepo,
		cancels:      make(map[int64]context.CancelFunc),
	}
}

// Start loads all enabled subscriptions and begins listening.
func (rs *RedisSubscriber) Start() error {
	subs, err := rs.subRepo.ListEnabled()
	if err != nil {
		return fmt.Errorf("redis subscriber: failed to list subs: %w", err)
	}

	for _, sub := range subs {
		if err := rs.startSubscription(sub.ID, sub.WorkflowID, sub.ConfigID, sub.Channel, sub.IsPattern); err != nil {
			log.Printf("[RedisSubscriber] Failed to start sub %d: %v", sub.ID, err)
		}
	}

	log.Printf("[RedisSubscriber] Started with %d active subscriptions", len(subs))
	return nil
}

// Stop cancels all active subscriptions and waits for goroutines to finish.
func (rs *RedisSubscriber) Stop() {
	rs.mu.Lock()
	for id, cancel := range rs.cancels {
		cancel()
		delete(rs.cancels, id)
	}
	rs.mu.Unlock()
	rs.wg.Wait()
	log.Println("[RedisSubscriber] Stopped")
}

// AddSubscription starts listening on a new subscription.
func (rs *RedisSubscriber) AddSubscription(subID, workflowID, configID int64, channel string, isPattern bool) error {
	return rs.startSubscription(subID, workflowID, configID, channel, isPattern)
}

// RemoveSubscription stops a running subscription listener.
func (rs *RedisSubscriber) RemoveSubscription(subID int64) {
	rs.mu.Lock()
	defer rs.mu.Unlock()
	if cancel, ok := rs.cancels[subID]; ok {
		cancel()
		delete(rs.cancels, subID)
	}
}

func (rs *RedisSubscriber) startSubscription(subID, workflowID, configID int64, channel string, isPattern bool) error {
	// Resolve Redis config
	cfg, err := rs.configRepo.GetByID(configID)
	if err != nil {
		return fmt.Errorf("failed to resolve config %d: %w", configID, err)
	}
	if cfg.Type != "redis" {
		return fmt.Errorf("config %d is not redis type (got %s)", configID, cfg.Type)
	}

	host, _ := cfg.Config["host"].(string)
	if host == "" {
		host = "127.0.0.1"
	}
	port, _ := cfg.Config["port"].(string)
	if port == "" {
		if pf, ok := cfg.Config["port"].(float64); ok {
			port = strconv.Itoa(int(pf))
		} else {
			port = "6379"
		}
	}
	password, _ := cfg.Config["password"].(string)
	dbNum := 0
	if dbRaw, ok := cfg.Config["db"]; ok {
		if dbf, ok := dbRaw.(float64); ok {
			dbNum = int(dbf)
		}
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     host + ":" + port,
		Password: password,
		DB:       dbNum,
	})

	// Test connection
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		rdb.Close()
		return fmt.Errorf("redis connection failed: %w", err)
	}

	// Remove existing sub if running
	rs.RemoveSubscription(subID)

	subCtx, cancel := context.WithCancel(context.Background())

	rs.mu.Lock()
	rs.cancels[subID] = cancel
	rs.mu.Unlock()

	rs.wg.Add(1)

	go func() {
		defer rs.wg.Done()
		defer rdb.Close()

		var pubsub *redis.PubSub
		if isPattern {
			pubsub = rdb.PSubscribe(subCtx, channel)
		} else {
			pubsub = rdb.Subscribe(subCtx, channel)
		}
		defer pubsub.Close()

		mode := "SUBSCRIBE"
		if isPattern {
			mode = "PSUBSCRIBE"
		}
		log.Printf("[RedisSubscriber] %s %q for workflow %d (sub %d)", mode, channel, workflowID, subID)

		ch := pubsub.Channel()
		for {
			select {
			case <-subCtx.Done():
				log.Printf("[RedisSubscriber] Stopped sub %d", subID)
				return
			case msg, ok := <-ch:
				if !ok {
					log.Printf("[RedisSubscriber] Channel closed for sub %d, reconnecting...", subID)
					return
				}
				rs.handleMessage(subID, workflowID, channel, msg)
			}
		}
	}()

	return nil
}

func (rs *RedisSubscriber) handleMessage(subID, workflowID int64, channel string, msg *redis.Message) {
	log.Printf("[RedisSubscriber] Message on %q (sub %d): %s", msg.Channel, subID, truncate(msg.Payload, 100))

	// Update stats
	_ = rs.subRepo.IncrementMsgCount(subID)

	// Load workflow
	wf, err := rs.workflowRepo.GetByID(workflowID)
	if err != nil {
		log.Printf("[RedisSubscriber] Failed to load workflow %d: %v", workflowID, err)
		return
	}

	// Inject the message as input to the start node
	// We'll do this by modifying the engine context — the redis_subscribe node
	// will receive this data through its input parameter
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Run the workflow with message data injected
	execID, err := rs.engine.RunWorkflowWithInput(ctx, wf, map[string]interface{}{
		"message":        msg.Payload,
		"channel":        msg.Channel,
		"pattern":        msg.Pattern,
		"subscriptionId": subID,
		"receivedAt":     time.Now().Format(time.RFC3339),
	})

	if err != nil {
		log.Printf("[RedisSubscriber] Workflow %d execution failed (exec %d): %v", workflowID, execID, err)
	} else {
		log.Printf("[RedisSubscriber] Workflow %d execution completed (exec %d)", workflowID, execID)
	}
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
