package repository

import (
	"database/sql"
	"eflo/backend/models"
	"strings"
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

// GetLastRunByWorkflowIDs returns the most recent started_at for each workflow.
// Used to show "last run" in workflow list.
func (r *ExecutionRepo) GetLastRunByWorkflowIDs(workflowIDs []int64) (map[int64]*time.Time, error) {
	if len(workflowIDs) == 0 {
		return map[int64]*time.Time{}, nil
	}
	args := make([]interface{}, 0, len(workflowIDs))
	for _, id := range workflowIDs {
		args = append(args, id)
	}
	// Build "?,?,?" for IN clause
	placeholders := strings.Repeat("?,", len(workflowIDs))
	placeholders = placeholders[:len(placeholders)-1]
	query := "SELECT workflow_id, MAX(started_at) AS last_run FROM executions WHERE workflow_id IN (" + placeholders + ") AND started_at IS NOT NULL GROUP BY workflow_id"
	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make(map[int64]*time.Time)
	for rows.Next() {
		var wfID int64
		var t time.Time
		if err := rows.Scan(&wfID, &t); err != nil {
			return nil, err
		}
		out[wfID] = &t
	}
	return out, nil
}

// GetAvgRunTimeByWorkflowIDs returns the average run duration in seconds per workflow
// (finished_at - started_at) for completed executions only.
func (r *ExecutionRepo) GetAvgRunTimeByWorkflowIDs(workflowIDs []int64) (map[int64]*float64, error) {
	if len(workflowIDs) == 0 {
		return map[int64]*float64{}, nil
	}
	args := make([]interface{}, 0, len(workflowIDs))
	for _, id := range workflowIDs {
		args = append(args, id)
	}
	placeholders := strings.Repeat("?,", len(workflowIDs))
	placeholders = placeholders[:len(placeholders)-1]
	query := "SELECT workflow_id, AVG(TIMESTAMPDIFF(SECOND, started_at, finished_at)) AS avg_sec FROM executions WHERE workflow_id IN (" + placeholders + ") AND started_at IS NOT NULL AND finished_at IS NOT NULL GROUP BY workflow_id"
	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make(map[int64]*float64)
	for rows.Next() {
		var wfID int64
		var avgSec sql.NullFloat64
		if err := rows.Scan(&wfID, &avgSec); err != nil {
			return nil, err
		}
		if avgSec.Valid {
			out[wfID] = &avgSec.Float64
		}
	}
	return out, nil
}

// ExecutionGlobalStats holds aggregate execution metrics (completed executions only).
type ExecutionGlobalStats struct {
	TotalCount    int64   `json:"totalCount"`
	TotalDuration float64 `json:"totalDurationSec"`
	AvgDuration   float64 `json:"avgDurationSec"`
	MinDuration   float64 `json:"minDurationSec"`
	MaxDuration   float64 `json:"maxDurationSec"`
}

// GetGlobalStats returns global execution stats for completed runs (started_at and finished_at set).
func (r *ExecutionRepo) GetGlobalStats() (*ExecutionGlobalStats, error) {
	row := r.DB.QueryRow(`
		SELECT
			COUNT(*) AS total_count,
			COALESCE(SUM(TIMESTAMPDIFF(SECOND, started_at, finished_at)), 0) AS total_sec,
			COALESCE(AVG(TIMESTAMPDIFF(SECOND, started_at, finished_at)), 0) AS avg_sec,
			COALESCE(MIN(TIMESTAMPDIFF(SECOND, started_at, finished_at)), 0) AS min_sec,
			COALESCE(MAX(TIMESTAMPDIFF(SECOND, started_at, finished_at)), 0) AS max_sec
		FROM executions
		WHERE started_at IS NOT NULL AND finished_at IS NOT NULL
	`)
	s := &ExecutionGlobalStats{}
	var totalSec, avgSec, minSec, maxSec sql.NullFloat64
	if err := row.Scan(&s.TotalCount, &totalSec, &avgSec, &minSec, &maxSec); err != nil {
		return nil, err
	}
	if totalSec.Valid {
		s.TotalDuration = totalSec.Float64
	}
	if avgSec.Valid {
		s.AvgDuration = avgSec.Float64
	}
	if minSec.Valid {
		s.MinDuration = minSec.Float64
	}
	if maxSec.Valid {
		s.MaxDuration = maxSec.Float64
	}
	return s, nil
}

// DayStat holds per-day execution count and average duration.
type DayStat struct {
	Date           string  `json:"date"`
	Count          int64   `json:"count"`
	AvgDurationSec float64 `json:"avgDurationSec"`
	TotalDurationSec float64 `json:"totalDurationSec"`
}

// GetStatsByDay returns per-day stats for the last N days (only completed executions).
func (r *ExecutionRepo) GetStatsByDay(days int) ([]DayStat, error) {
	if days <= 0 {
		days = 14
	}
	rows, err := r.DB.Query(`
		SELECT
			DATE(started_at) AS d,
			COUNT(*) AS cnt,
			AVG(TIMESTAMPDIFF(SECOND, started_at, finished_at)) AS avg_sec,
			SUM(TIMESTAMPDIFF(SECOND, started_at, finished_at)) AS total_sec
		FROM executions
		WHERE started_at IS NOT NULL AND finished_at IS NOT NULL
		  AND started_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
		GROUP BY DATE(started_at)
		ORDER BY d ASC
	`, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []DayStat
	for rows.Next() {
		var d time.Time
		var cnt int64
		var avgSec, totalSec sql.NullFloat64
		if err := rows.Scan(&d, &cnt, &avgSec, &totalSec); err != nil {
			return nil, err
		}
		ds := DayStat{Date: d.Format("2006-01-02"), Count: cnt}
		if avgSec.Valid {
			ds.AvgDurationSec = avgSec.Float64
		}
		if totalSec.Valid {
			ds.TotalDurationSec = totalSec.Float64
		}
		list = append(list, ds)
	}
	return list, nil
}
