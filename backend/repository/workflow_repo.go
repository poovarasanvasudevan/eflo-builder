package repository

import (
	"database/sql"
	"eflo/backend/models"
	"encoding/json"
)

type WorkflowRepo struct {
	DB *sql.DB
}

func NewWorkflowRepo(db *sql.DB) *WorkflowRepo {
	return &WorkflowRepo{DB: db}
}

func (r *WorkflowRepo) Create(w *models.Workflow) (int64, error) {
	defJSON, err := json.Marshal(w.Definition)
	if err != nil {
		return 0, err
	}
	res, err := r.DB.Exec(
		"INSERT INTO workflows (name, description, definition) VALUES (?, ?, ?)",
		w.Name, w.Description, string(defJSON),
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *WorkflowRepo) GetByID(id int64) (*models.Workflow, error) {
	row := r.DB.QueryRow("SELECT id, name, description, definition, created_at, updated_at FROM workflows WHERE id = ?", id)
	w := &models.Workflow{}
	var defStr string
	if err := row.Scan(&w.ID, &w.Name, &w.Description, &defStr, &w.CreatedAt, &w.UpdatedAt); err != nil {
		return nil, err
	}
	w.Definition = &models.WorkflowDefinition{}
	if err := json.Unmarshal([]byte(defStr), w.Definition); err != nil {
		return nil, err
	}
	return w, nil
}

func (r *WorkflowRepo) List() ([]*models.Workflow, error) {
	rows, err := r.DB.Query("SELECT id, name, description, definition, created_at, updated_at FROM workflows ORDER BY updated_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workflows []*models.Workflow
	for rows.Next() {
		w := &models.Workflow{}
		var defStr string
		if err := rows.Scan(&w.ID, &w.Name, &w.Description, &defStr, &w.CreatedAt, &w.UpdatedAt); err != nil {
			return nil, err
		}
		w.Definition = &models.WorkflowDefinition{}
		if err := json.Unmarshal([]byte(defStr), w.Definition); err != nil {
			return nil, err
		}
		workflows = append(workflows, w)
	}
	return workflows, nil
}

func (r *WorkflowRepo) Update(w *models.Workflow) error {
	defJSON, err := json.Marshal(w.Definition)
	if err != nil {
		return err
	}
	_, err = r.DB.Exec(
		"UPDATE workflows SET name = ?, description = ?, definition = ? WHERE id = ?",
		w.Name, w.Description, string(defJSON), w.ID,
	)
	return err
}

func (r *WorkflowRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM workflows WHERE id = ?", id)
	return err
}
