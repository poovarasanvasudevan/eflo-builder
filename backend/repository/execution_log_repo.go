package repository

import (
	"database/sql"
	"eflo/backend/models"
)

type ExecutionLogRepo struct {
	DB *sql.DB
}

func NewExecutionLogRepo(db *sql.DB) *ExecutionLogRepo {
	return &ExecutionLogRepo{DB: db}
}

func (r *ExecutionLogRepo) Create(log *models.ExecutionLog) (int64, error) {
	res, err := r.DB.Exec(
		"INSERT INTO execution_logs (execution_id, node_id, node_type, status, input, output, error) VALUES (?, ?, ?, ?, ?, ?, ?)",
		log.ExecutionID, log.NodeID, log.NodeType, log.Status, log.Input, log.Output, log.Error,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *ExecutionLogRepo) ListByExecution(executionID int64) ([]*models.ExecutionLog, error) {
	rows, err := r.DB.Query(
		"SELECT id, execution_id, node_id, node_type, status, input, output, error, executed_at FROM execution_logs WHERE execution_id = ? ORDER BY executed_at ASC",
		executionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.ExecutionLog
	for rows.Next() {
		l := &models.ExecutionLog{}
		var input, output, errStr sql.NullString
		if err := rows.Scan(&l.ID, &l.ExecutionID, &l.NodeID, &l.NodeType, &l.Status, &input, &output, &errStr, &l.ExecutedAt); err != nil {
			return nil, err
		}
		if input.Valid {
			l.Input = input.String
		}
		if output.Valid {
			l.Output = output.String
		}
		if errStr.Valid {
			l.Error = errStr.String
		}
		logs = append(logs, l)
	}
	return logs, nil
}
