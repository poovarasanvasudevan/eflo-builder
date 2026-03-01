package repository

import (
	"database/sql"

	"eflo/backend/models"
)

type ConfigStoreRepo struct {
	DB *sql.DB
}

func NewConfigStoreRepo(db *sql.DB) *ConfigStoreRepo {
	return &ConfigStoreRepo{DB: db}
}

func (r *ConfigStoreRepo) Get(key string) (string, bool, error) {
	var value string
	err := r.DB.QueryRow(
		"SELECT value FROM config_store WHERE `key` = ?",
		key,
	).Scan(&value)
	if err == sql.ErrNoRows {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return value, true, nil
}

func (r *ConfigStoreRepo) GetEntry(key string) (*models.ConfigStoreEntry, error) {
	e := &models.ConfigStoreEntry{}
	var desc sql.NullString
	err := r.DB.QueryRow(
		"SELECT `key`, value, description, created_at, updated_at FROM config_store WHERE `key` = ?",
		key,
	).Scan(&e.Key, &e.Value, &desc, &e.CreatedAt, &e.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if desc.Valid {
		e.Description = desc.String
	}
	return e, nil
}

func (r *ConfigStoreRepo) Set(key, value, description string) error {
	_, err := r.DB.Exec(
		"INSERT INTO config_store (`key`, value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), description = VALUES(description)",
		key, value, description,
	)
	return err
}

func (r *ConfigStoreRepo) Delete(key string) error {
	_, err := r.DB.Exec("DELETE FROM config_store WHERE `key` = ?", key)
	return err
}

func (r *ConfigStoreRepo) List() ([]*models.ConfigStoreEntry, error) {
	rows, err := r.DB.Query(
		"SELECT `key`, value, description, created_at, updated_at FROM config_store ORDER BY `key` ASC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*models.ConfigStoreEntry
	for rows.Next() {
		e := &models.ConfigStoreEntry{}
		var desc sql.NullString
		if err := rows.Scan(&e.Key, &e.Value, &desc, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			e.Description = desc.String
		}
		entries = append(entries, e)
	}
	return entries, nil
}
