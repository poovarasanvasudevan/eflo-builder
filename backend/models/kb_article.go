package models

import "time"

// KBArticle is a knowledge base article (Confluence-style).
// Content is stored as JSON (TipTap/ADF document).
type KBArticle struct {
	ID        int64                  `json:"id"`
	Title     string                 `json:"title"`
	Slug      string                 `json:"slug"`
	Summary   string                 `json:"summary"`
	Content   map[string]interface{} `json:"content,omitempty"`
	ParentID  *int64                 `json:"parentId,omitempty"`
	SpaceKey  string                 `json:"spaceKey"`
	CreatedAt time.Time              `json:"createdAt"`
	UpdatedAt time.Time              `json:"updatedAt"`
}
