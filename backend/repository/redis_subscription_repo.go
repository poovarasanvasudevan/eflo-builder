package repository

import (
	"database/sql"
	"eflo/backend/models"
)

type RedisSubscriptionRepo struct {
	DB *sql.DB
}

func NewRedisSubscriptionRepo(db *sql.DB) *RedisSubscriptionRepo {
	return &RedisSubscriptionRepo{DB: db}
}

func (r *RedisSubscriptionRepo) Create(s *models.RedisSubscription) (int64, error) {
	res, err := r.DB.Exec(
		`INSERT INTO redis_subscriptions (workflow_id, config_id, channel, is_pattern, enabled)
		 VALUES (?, ?, ?, ?, ?)`,
		s.WorkflowID, s.ConfigID, s.Channel, s.IsPattern, s.Enabled,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *RedisSubscriptionRepo) GetByID(id int64) (*models.RedisSubscription, error) {
	row := r.DB.QueryRow(
		`SELECT id, workflow_id, config_id, channel, is_pattern, enabled, last_msg_at, msg_count, created_at, updated_at
		 FROM redis_subscriptions WHERE id = ?`, id,
	)
	return r.scanRow(row)
}

func (r *RedisSubscriptionRepo) List() ([]*models.RedisSubscription, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, config_id, channel, is_pattern, enabled, last_msg_at, msg_count, created_at, updated_at
		 FROM redis_subscriptions ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *RedisSubscriptionRepo) ListEnabled() ([]*models.RedisSubscription, error) {
	rows, err := r.DB.Query(
		`SELECT id, workflow_id, config_id, channel, is_pattern, enabled, last_msg_at, msg_count, created_at, updated_at
		 FROM redis_subscriptions WHERE enabled = 1 ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *RedisSubscriptionRepo) Update(s *models.RedisSubscription) error {
	_, err := r.DB.Exec(
		`UPDATE redis_subscriptions SET channel = ?, is_pattern = ?, enabled = ?, config_id = ? WHERE id = ?`,
		s.Channel, s.IsPattern, s.Enabled, s.ConfigID, s.ID,
	)
	return err
}

func (r *RedisSubscriptionRepo) IncrementMsgCount(id int64) error {
	_, err := r.DB.Exec(
		`UPDATE redis_subscriptions SET msg_count = msg_count + 1, last_msg_at = NOW() WHERE id = ?`, id,
	)
	return err
}

func (r *RedisSubscriptionRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM redis_subscriptions WHERE id = ?", id)
	return err
}

func (r *RedisSubscriptionRepo) scanRow(row *sql.Row) (*models.RedisSubscription, error) {
	s := &models.RedisSubscription{}
	var lastMsg sql.NullTime
	err := row.Scan(&s.ID, &s.WorkflowID, &s.ConfigID, &s.Channel, &s.IsPattern,
		&s.Enabled, &lastMsg, &s.MsgCount, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if lastMsg.Valid {
		s.LastMsgAt = &lastMsg.Time
	}
	return s, nil
}

func (r *RedisSubscriptionRepo) scanRows(rows *sql.Rows) ([]*models.RedisSubscription, error) {
	var subs []*models.RedisSubscription
	for rows.Next() {
		s := &models.RedisSubscription{}
		var lastMsg sql.NullTime
		err := rows.Scan(&s.ID, &s.WorkflowID, &s.ConfigID, &s.Channel, &s.IsPattern,
			&s.Enabled, &lastMsg, &s.MsgCount, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if lastMsg.Valid {
			s.LastMsgAt = &lastMsg.Time
		}
		subs = append(subs, s)
	}
	return subs, nil
}
