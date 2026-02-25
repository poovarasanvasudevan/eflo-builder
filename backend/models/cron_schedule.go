package models

import "time"

// CronSchedule represents a scheduled cron job linked to a workflow.
type CronSchedule struct {
	ID         int64      `json:"id"`
	WorkflowID int64      `json:"workflowId"`
	Expression string     `json:"expression"` // cron expression e.g. "*/5 * * * *"
	Timezone   string     `json:"timezone"`
	Enabled    bool       `json:"enabled"`
	LastRunAt  *time.Time `json:"lastRunAt,omitempty"`
	NextRunAt  *time.Time `json:"nextRunAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
	UpdatedAt  time.Time  `json:"updatedAt"`
}
