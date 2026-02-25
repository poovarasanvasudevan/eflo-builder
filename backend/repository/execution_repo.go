package repository

import (
	"database/sql"
	"eflo/backend/models"
	"time"
)

type ExecutionRepo struct {
	DB *sql.DB
}

func NewExecutionRepo(db *sql.DB) *ExecutionRepo {
	return &ExecutionRepo{DB: db}
}

func (r *ExecutionRepo) Create(e *models.Execution) (int64, error) {
	now := time.Now()
	e.StartedAt = &now
	res, err := r.DB.Exec(
		"INSERT INTO executions (workflow_id, status, started_at) VALUES (?, ?, ?)",
		e.WorkflowID, e.Status, e.StartedAt,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *ExecutionRepo) Finish(id int64, status string, errMsg string) error {
	now := time.Now()
	_, err := r.DB.Exec(
		"UPDATE executions SET status = ?, finished_at = ?, error = ? WHERE id = ?",
		status, now, errMsg, id,
	)
	return err
}

func (r *ExecutionRepo) GetByID(id int64) (*models.Execution, error) {
	row := r.DB.QueryRow("SELECT id, workflow_id, status, started_at, finished_at, error FROM executions WHERE id = ?", id)
	e := &models.Execution{}
	var errStr sql.NullString
	var startedAt, finishedAt sql.NullTime
	if err := row.Scan(&e.ID, &e.WorkflowID, &e.Status, &startedAt, &finishedAt, &errStr); err != nil {
		return nil, err
	}
	if startedAt.Valid {
		e.StartedAt = &startedAt.Time
	}
	if finishedAt.Valid {
		e.FinishedAt = &finishedAt.Time
	}
	if errStr.Valid {
		e.Error = errStr.String
	}
	return e, nil
}

func (r *ExecutionRepo) ListByWorkflow(workflowID int64) ([]*models.Execution, error) {
	rows, err := r.DB.Query(
		"SELECT id, workflow_id, status, started_at, finished_at, error FROM executions WHERE workflow_id = ? ORDER BY started_at DESC",
		workflowID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.Execution
	for rows.Next() {
		e := &models.Execution{}
		var errStr sql.NullString
		var startedAt, finishedAt sql.NullTime
		if err := rows.Scan(&e.ID, &e.WorkflowID, &e.Status, &startedAt, &finishedAt, &errStr); err != nil {
			return nil, err
		}
		if startedAt.Valid {
			e.StartedAt = &startedAt.Time
		}
		if finishedAt.Valid {
			e.FinishedAt = &finishedAt.Time
		}
		if errStr.Valid {
			e.Error = errStr.String
		}
		list = append(list, e)
	}
	return list, nil
}
