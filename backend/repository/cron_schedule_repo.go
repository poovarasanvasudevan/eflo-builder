package repository

import (
	"database/sql"
	"eflo/backend/models"
)

type CronScheduleRepo struct {
	DB *sql.DB
}

func NewCronScheduleRepo(db *sql.DB) *CronScheduleRepo {
	return &CronScheduleRepo{DB: db}
}

func (r *CronScheduleRepo) Create(s *models.CronSchedule) (int64, error) {
	res, err := r.DB.Exec(
		`INSERT INTO cron_schedules (workflow_id, expression, timezone, enabled, next_run_at) 
		 VALUES (?, ?, ?, ?, ?)`,
		s.WorkflowID, s.Expression, s.Timezone, s.Enabled, s.NextRunAt,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *CronScheduleRepo) GetByID(id int64) (*models.CronSchedule, error) {
	row := r.DB.QueryRow(
		`SELECT id, workflow_id, expression, timezone, enabled, last_run_at, next_run_at, created_at, updated_at 
		 FROM cron_schedules WHERE id = ?`, id,
	)
	return r.scanRow(row)
}

func (r *CronScheduleRepo) GetByWorkflowID(workflowID int64) ([]*models.CronSchedule, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, expression, timezone, enabled, last_run_at, next_run_at, created_at, updated_at 
		 FROM cron_schedules WHERE workflow_id = ? ORDER BY id ASC`, workflowID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *CronScheduleRepo) ListEnabled() ([]*models.CronSchedule, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, expression, timezone, enabled, last_run_at, next_run_at, created_at, updated_at 
		 FROM cron_schedules WHERE enabled = 1 ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *CronScheduleRepo) List() ([]*models.CronSchedule, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, expression, timezone, enabled, last_run_at, next_run_at, created_at, updated_at 
		 FROM cron_schedules ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *CronScheduleRepo) Update(s *models.CronSchedule) error {
	_, err := r.DB.Exec(
		`UPDATE cron_schedules SET expression = ?, timezone = ?, enabled = ?, next_run_at = ? WHERE id = ?`,
		s.Expression, s.Timezone, s.Enabled, s.NextRunAt, s.ID,
	)
	return err
}

func (r *CronScheduleRepo) UpdateLastRun(id int64, lastRunAt, nextRunAt interface{}) error {
	_, err := r.DB.Exec(
		`UPDATE cron_schedules SET last_run_at = ?, next_run_at = ? WHERE id = ?`,
		lastRunAt, nextRunAt, id,
	)
	return err
}

func (r *CronScheduleRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM cron_schedules WHERE id = ?", id)
	return err
}

func (r *CronScheduleRepo) scanRow(row *sql.Row) (*models.CronSchedule, error) {
	s := &models.CronSchedule{}
	var lastRun, nextRun sql.NullTime
	err := row.Scan(&s.ID, &s.WorkflowID, &s.Expression, &s.Timezone, &s.Enabled,
		&lastRun, &nextRun, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if lastRun.Valid {
		s.LastRunAt = &lastRun.Time
	}
	if nextRun.Valid {
		s.NextRunAt = &nextRun.Time
	}
	return s, nil
}

func (r *CronScheduleRepo) scanRows(rows *sql.Rows) ([]*models.CronSchedule, error) {
	var schedules []*models.CronSchedule
	for rows.Next() {
		s := &models.CronSchedule{}
		var lastRun, nextRun sql.NullTime
		err := rows.Scan(&s.ID, &s.WorkflowID, &s.Expression, &s.Timezone, &s.Enabled,
			&lastRun, &nextRun, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if lastRun.Valid {
			s.LastRunAt = &lastRun.Time
		}
		if nextRun.Valid {
			s.NextRunAt = &nextRun.Time
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}
