package repository

import (
	"database/sql"
	"eflo/backend/models"
)

type EmailTriggerRepo struct {
	DB *sql.DB
}

func NewEmailTriggerRepo(db *sql.DB) *EmailTriggerRepo {
	return &EmailTriggerRepo{DB: db}
}

func (r *EmailTriggerRepo) Create(t *models.EmailTrigger) (int64, error) {
	res, err := r.DB.Exec(
		`INSERT INTO email_triggers (workflow_id, config_id, mailbox, poll_interval_sec, mark_seen, max_fetch, enabled)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		t.WorkflowID, t.ConfigID, t.Mailbox, t.PollIntervalSec, t.MarkSeen, t.MaxFetch, t.Enabled,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *EmailTriggerRepo) GetByID(id int64) (*models.EmailTrigger, error) {
	row := r.DB.QueryRow(
		`SELECT id, workflow_id, config_id, mailbox, poll_interval_sec, mark_seen, max_fetch, enabled, last_poll_at, msg_count, created_at, updated_at
		 FROM email_triggers WHERE id = ?`, id,
	)
	return r.scanRow(row)
}

func (r *EmailTriggerRepo) List() ([]*models.EmailTrigger, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, config_id, mailbox, poll_interval_sec, mark_seen, max_fetch, enabled, last_poll_at, msg_count, created_at, updated_at
		 FROM email_triggers ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *EmailTriggerRepo) ListEnabled() ([]*models.EmailTrigger, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, config_id, mailbox, poll_interval_sec, mark_seen, max_fetch, enabled, last_poll_at, msg_count, created_at, updated_at
		 FROM email_triggers WHERE enabled = 1 ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *EmailTriggerRepo) Update(t *models.EmailTrigger) error {
	_, err := r.DB.Exec(
		`UPDATE email_triggers SET mailbox = ?, poll_interval_sec = ?, mark_seen = ?, max_fetch = ?, enabled = ?, config_id = ? WHERE id = ?`,
		t.Mailbox, t.PollIntervalSec, t.MarkSeen, t.MaxFetch, t.Enabled, t.ConfigID, t.ID,
	)
	return err
}

func (r *EmailTriggerRepo) IncrementMsgCount(id int64) error {
	_, err := r.DB.Exec(
		`UPDATE email_triggers SET msg_count = msg_count + 1, last_poll_at = NOW() WHERE id = ?`, id,
	)
	return err
}

func (r *EmailTriggerRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM email_triggers WHERE id = ?", id)
	return err
}

func (r *EmailTriggerRepo) scanRow(row *sql.Row) (*models.EmailTrigger, error) {
	t := &models.EmailTrigger{}
	var lastPoll sql.NullTime
	err := row.Scan(&t.ID, &t.WorkflowID, &t.ConfigID, &t.Mailbox, &t.PollIntervalSec,
		&t.MarkSeen, &t.MaxFetch, &t.Enabled, &lastPoll, &t.MsgCount, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if lastPoll.Valid {
		t.LastPollAt = &lastPoll.Time
	}
	return t, nil
}

func (r *EmailTriggerRepo) scanRows(rows *sql.Rows) ([]*models.EmailTrigger, error) {
	var triggers []*models.EmailTrigger
	for rows.Next() {
		t := &models.EmailTrigger{}
		var lastPoll sql.NullTime
		err := rows.Scan(&t.ID, &t.WorkflowID, &t.ConfigID, &t.Mailbox, &t.PollIntervalSec,
			&t.MarkSeen, &t.MaxFetch, &t.Enabled, &lastPoll, &t.MsgCount, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if lastPoll.Valid {
			t.LastPollAt = &lastPoll.Time
		}
		triggers = append(triggers, t)
	}
	return triggers, nil
}
