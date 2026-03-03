package repository

import (
	"database/sql"
	"encoding/json"

	"eflo/backend/models"
)

type KBArticleRepo struct {
	DB *sql.DB
}

func NewKBArticleRepo(db *sql.DB) *KBArticleRepo {
	return &KBArticleRepo{DB: db}
}

func (r *KBArticleRepo) Create(a *models.KBArticle) (int64, error) {
	contentJSON, _ := json.Marshal(a.Content)
	res, err := r.DB.Exec(
		`INSERT INTO kb_articles (title, slug, summary, content, parent_id, space_key)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		a.Title, a.Slug, a.Summary, contentJSON, a.ParentID, a.SpaceKey,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *KBArticleRepo) GetByID(id int64) (*models.KBArticle, error) {
	row := r.DB.QueryRow(
		`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
		 FROM kb_articles WHERE id = ?`,
		id,
	)
	a := &models.KBArticle{}
	var contentJSON []byte
	if err := row.Scan(&a.ID, &a.Title, &a.Slug, &a.Summary, &contentJSON, &a.ParentID, &a.SpaceKey, &a.CreatedAt, &a.UpdatedAt); err != nil {
		return nil, err
	}
	if len(contentJSON) > 0 {
		_ = json.Unmarshal(contentJSON, &a.Content)
	}
	return a, nil
}

func (r *KBArticleRepo) List(spaceKey string, parentID *int64) ([]*models.KBArticle, error) {
	var rows *sql.Rows
	var err error
	if parentID == nil {
		rows, err = r.DB.Query(
			`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
			 FROM kb_articles WHERE space_key = ? AND parent_id IS NULL ORDER BY title`,
			spaceKey,
		)
	} else {
		rows, err = r.DB.Query(
			`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
			 FROM kb_articles WHERE space_key = ? AND parent_id = ? ORDER BY title`,
			spaceKey, *parentID,
		)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.KBArticle
	for rows.Next() {
		a := &models.KBArticle{}
		var contentJSON []byte
		if err := rows.Scan(&a.ID, &a.Title, &a.Slug, &a.Summary, &contentJSON, &a.ParentID, &a.SpaceKey, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		if len(contentJSON) > 0 {
			_ = json.Unmarshal(contentJSON, &a.Content)
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *KBArticleRepo) ListAll(spaceKey string) ([]*models.KBArticle, error) {
	rows, err := r.DB.Query(
		`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
		 FROM kb_articles WHERE space_key = ? ORDER BY parent_id, title`,
		spaceKey,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.KBArticle
	for rows.Next() {
		a := &models.KBArticle{}
		var contentJSON []byte
		if err := rows.Scan(&a.ID, &a.Title, &a.Slug, &a.Summary, &contentJSON, &a.ParentID, &a.SpaceKey, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		if len(contentJSON) > 0 {
			_ = json.Unmarshal(contentJSON, &a.Content)
		}
		list = append(list, a)
	}
	return list, nil
}

func (r *KBArticleRepo) Search(spaceKey, query string, limit int) ([]*models.KBArticle, error) {
	if limit <= 0 {
		limit = 20
	}
	q := "%" + query + "%"
	rows, err := r.DB.Query(
		`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
		 FROM kb_articles WHERE space_key = ? AND (title LIKE ? OR summary LIKE ? OR slug LIKE ?)
		 ORDER BY updated_at DESC LIMIT ?`,
		spaceKey, q, q, q, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.KBArticle
	for rows.Next() {
		a := &models.KBArticle{}
		var contentJSON []byte
		if err := rows.Scan(&a.ID, &a.Title, &a.Slug, &a.Summary, &contentJSON, &a.ParentID, &a.SpaceKey, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		a.Content = nil
		list = append(list, a)
	}
	return list, nil
}

func (r *KBArticleRepo) Update(a *models.KBArticle) error {
	contentJSON, _ := json.Marshal(a.Content)
	_, err := r.DB.Exec(
		`UPDATE kb_articles SET title = ?, slug = ?, summary = ?, content = ?, parent_id = ?, space_key = ? WHERE id = ?`,
		a.Title, a.Slug, a.Summary, contentJSON, a.ParentID, a.SpaceKey, a.ID,
	)
	return err
}

func (r *KBArticleRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM kb_articles WHERE id = ?", id)
	return err
}

func (r *KBArticleRepo) GetBySlug(spaceKey string, parentID *int64, slug string) (*models.KBArticle, error) {
	var row *sql.Row
	if parentID == nil {
		row = r.DB.QueryRow(
			`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
			 FROM kb_articles WHERE space_key = ? AND parent_id IS NULL AND slug = ?`,
			spaceKey, slug,
		)
	} else {
		row = r.DB.QueryRow(
			`SELECT id, title, slug, summary, content, parent_id, space_key, created_at, updated_at
			 FROM kb_articles WHERE space_key = ? AND parent_id = ? AND slug = ?`,
			spaceKey, *parentID, slug,
		)
	}
	a := &models.KBArticle{}
	var contentJSON []byte
	if err := row.Scan(&a.ID, &a.Title, &a.Slug, &a.Summary, &contentJSON, &a.ParentID, &a.SpaceKey, &a.CreatedAt, &a.UpdatedAt); err != nil {
		return nil, err
	}
	if len(contentJSON) > 0 {
		_ = json.Unmarshal(contentJSON, &a.Content)
	}
	return a, nil
}
