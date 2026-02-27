package repository

import (
	"database/sql"
	"eflo/backend/models"
)

type HttpTriggerRepo struct {
	DB *sql.DB
}

func NewHttpTriggerRepo(db *sql.DB) *HttpTriggerRepo {
	return &HttpTriggerRepo{DB: db}
}

func (r *HttpTriggerRepo) Create(t *models.HttpTrigger) (int64, error) {
	res, err := r.DB.Exec(
		`INSERT INTO http_triggers (workflow_id, path, method, enabled)
		 VALUES (?, ?, ?, ?)`,
		t.WorkflowID, t.Path, t.Method, t.Enabled,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *HttpTriggerRepo) GetByID(id int64) (*models.HttpTrigger, error) {
	row := r.DB.QueryRow(
		`SELECT id, workflow_id, path, method, enabled, created_at, updated_at
		 FROM http_triggers WHERE id = ?`, id,
	)
	return r.scanRow(row)
}

func (r *HttpTriggerRepo) FindByPathAndMethod(path, method string) (*models.HttpTrigger, error) {
	row := r.DB.QueryRow(
		`SELECT id, workflow_id, path, method, enabled, created_at, updated_at
		 FROM http_triggers WHERE path = ? AND method = ? AND enabled = 1`, path, method,
	)
	return r.scanRow(row)
}

func (r *HttpTriggerRepo) List() ([]*models.HttpTrigger, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, path, method, enabled, created_at, updated_at
		 FROM http_triggers ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *HttpTriggerRepo) ListEnabled() ([]*models.HttpTrigger, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, path, method, enabled, created_at, updated_at
		 FROM http_triggers WHERE enabled = 1 ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *HttpTriggerRepo) Update(t *models.HttpTrigger) error {
	_, err := r.DB.Exec(
		`UPDATE http_triggers SET path = ?, method = ?, enabled = ? WHERE id = ?`,
		t.Path, t.Method, t.Enabled, t.ID,
	)
	return err
}

func (r *HttpTriggerRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM http_triggers WHERE id = ?", id)
	return err
}

func (r *HttpTriggerRepo) scanRow(row *sql.Row) (*models.HttpTrigger, error) {
	t := &models.HttpTrigger{}
	err := row.Scan(&t.ID, &t.WorkflowID, &t.Path, &t.Method, &t.Enabled, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *HttpTriggerRepo) scanRows(rows *sql.Rows) ([]*models.HttpTrigger, error) {
	var list []*models.HttpTrigger
	for rows.Next() {
		t := &models.HttpTrigger{}
		if err := rows.Scan(&t.ID, &t.WorkflowID, &t.Path, &t.Method, &t.Enabled, &t.CreatedAt, &t.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}
