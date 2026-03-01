package models

import "time"

// ConfigStoreEntry is a key-value entry in the config store (secrets, tokens, etc.).
type ConfigStoreEntry struct {
	Key         string    `json:"key"`
	Value       string    `json:"value"`
	Description string    `json:"description,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
