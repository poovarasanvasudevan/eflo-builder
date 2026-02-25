package models

import "time"

// EmailTrigger represents an IMAP email polling trigger that runs a workflow on new emails.
type EmailTrigger struct {
	ID              int64      `json:"id"`
	WorkflowID      int64      `json:"workflowId"`
	ConfigID        int64      `json:"configId"`
	Mailbox         string     `json:"mailbox"`
	PollIntervalSec int        `json:"pollIntervalSec"`
	MarkSeen        bool       `json:"markSeen"`
	MaxFetch        int        `json:"maxFetch"`
	Enabled         bool       `json:"enabled"`
	LastPollAt      *time.Time `json:"lastPollAt,omitempty"`
	MsgCount        int64      `json:"msgCount"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}
