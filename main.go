package main

import (
	"fmt"
	"log"
	"net/http"

	"eflo/backend/api"
	"eflo/backend/config"
	"eflo/backend/db"
	"eflo/backend/engine"
	"eflo/backend/engine/nodes"
	"eflo/backend/repository"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	cfg := config.Load()

	// Connect to MySQL
	database, err := db.Connect(cfg.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed")

	// Initialize repositories
	workflowRepo := repository.NewWorkflowRepo(database)
	execRepo := repository.NewExecutionRepo(database)
	execLogRepo := repository.NewExecutionLogRepo(database)
	configRepo := repository.NewNodeConfigRepo(database)
	cronRepo := repository.NewCronScheduleRepo(database)
	redisSubRepo := repository.NewRedisSubscriptionRepo(database)
	emailTriggerRepo := repository.NewEmailTriggerRepo(database)

	// Register node types
	nodes.RegisterAll()

	// Initialize engine
	eng := engine.NewEngine(execRepo, execLogRepo, configRepo, workflowRepo)

	// Initialize and start cron scheduler
	scheduler := engine.NewScheduler(eng, workflowRepo, cronRepo)
	if err := scheduler.Start(); err != nil {
		log.Printf("Warning: Failed to start scheduler: %v", err)
	}
	defer scheduler.Stop()

	// Initialize and start Redis subscriber
	redisSub := engine.NewRedisSubscriber(eng, workflowRepo, configRepo, redisSubRepo)
	if err := redisSub.Start(); err != nil {
		log.Printf("Warning: Failed to start Redis subscriber: %v", err)
	}
	defer redisSub.Stop()

	// Initialize and start Email poller
	emailPoller := engine.NewEmailPoller(eng, workflowRepo, configRepo, emailTriggerRepo)
	if err := emailPoller.Start(); err != nil {
		log.Printf("Warning: Failed to start Email poller: %v", err)
	}
	defer emailPoller.Stop()

	// Setup router
	router := api.NewRouter(workflowRepo, execRepo, execLogRepo, configRepo, cronRepo, redisSubRepo, emailTriggerRepo, eng, scheduler, redisSub, emailPoller)

	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("Eflo workflow engine starting on %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
