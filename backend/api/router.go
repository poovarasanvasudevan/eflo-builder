package api

import (
	"net/http"

	"eflo/backend/engine"
	"eflo/backend/repository"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(
	workflowRepo *repository.WorkflowRepo,
	execRepo *repository.ExecutionRepo,
	execLogRepo *repository.ExecutionLogRepo,
	configRepo *repository.NodeConfigRepo,
	cronRepo *repository.CronScheduleRepo,
	redisSubRepo *repository.RedisSubscriptionRepo,
	emailTriggerRepo *repository.EmailTriggerRepo,
	eng *engine.Engine,
	scheduler *engine.Scheduler,
	redisSub *engine.RedisSubscriber,
	emailPoller *engine.EmailPoller,
) http.Handler {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	wh := &WorkflowHandler{Repo: workflowRepo}
	eh := &ExecutionHandler{
		WorkflowRepo: workflowRepo,
		ExecRepo:     execRepo,
		ExecLogRepo:  execLogRepo,
		Engine:       eng,
	}
	ch := &ConfigHandler{Repo: configRepo}
	crh := &CronHandler{Repo: cronRepo, Scheduler: scheduler}
	rsh := &RedisSubHandler{Repo: redisSubRepo, Subscriber: redisSub}
	eth := &EmailTriggerHandler{Repo: emailTriggerRepo, Poller: emailPoller}

	r.Route("/api", func(r chi.Router) {
		// Workflow CRUD
		r.Get("/workflows", wh.List)
		r.Post("/workflows", wh.Create)
		r.Get("/workflows/{id}", wh.GetByID)
		r.Put("/workflows/{id}", wh.Update)
		r.Delete("/workflows/{id}", wh.Delete)

		// Import / Export
		r.Get("/workflows/{id}/export", wh.Export)
		r.Post("/workflows/import", wh.Import)

		// Execution
		r.Post("/workflows/{id}/execute", eh.Execute)
		r.Get("/workflows/{id}/executions", eh.ListByWorkflow)
		r.Get("/executions/{id}", eh.GetExecution)
		r.Get("/executions/{id}/logs", eh.GetExecutionLogs)

		// Node Configs
		r.Get("/configs", ch.List)
		r.Post("/configs", ch.Create)
		r.Get("/configs/{id}", ch.GetByID)
		r.Put("/configs/{id}", ch.Update)
		r.Delete("/configs/{id}", ch.Delete)

		// Cron Schedules
		r.Get("/schedules", crh.List)
		r.Post("/schedules", crh.Create)
		r.Get("/schedules/{id}", crh.GetByID)
		r.Put("/schedules/{id}", crh.Update)
		r.Delete("/schedules/{id}", crh.Delete)

		// Redis Subscriptions
		r.Get("/redis-subscriptions", rsh.List)
		r.Post("/redis-subscriptions", rsh.Create)
		r.Get("/redis-subscriptions/{id}", rsh.GetByID)
		r.Put("/redis-subscriptions/{id}", rsh.Update)
		r.Delete("/redis-subscriptions/{id}", rsh.Delete)

		// Email Triggers
		r.Get("/email-triggers", eth.List)
		r.Post("/email-triggers", eth.Create)
		r.Get("/email-triggers/{id}", eth.GetByID)
		r.Put("/email-triggers/{id}", eth.Update)
		r.Delete("/email-triggers/{id}", eth.Delete)
	})

	return r
}
