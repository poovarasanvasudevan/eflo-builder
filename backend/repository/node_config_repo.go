package repository

import (
	"database/sql"
	"eflo/backend/models"
	"encoding/json"
)

type NodeConfigRepo struct {
	DB *sql.DB
}

func NewNodeConfigRepo(db *sql.DB) *NodeConfigRepo {
	return &NodeConfigRepo{DB: db}
}

func (r *NodeConfigRepo) Create(c *models.NodeConfig) (int64, error) {
	cfgJSON, err := json.Marshal(c.Config)
	if err != nil {
		return 0, err
	}
	res, err := r.DB.Exec(
		"INSERT INTO node_configs (name, type, config) VALUES (?, ?, ?)",
		c.Name, c.Type, string(cfgJSON),
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *NodeConfigRepo) GetByID(id int64) (*models.NodeConfig, error) {
	row := r.DB.QueryRow("SELECT id, name, type, config, created_at, updated_at FROM node_configs WHERE id = ?", id)
	c := &models.NodeConfig{}
	var cfgStr string
	if err := row.Scan(&c.ID, &c.Name, &c.Type, &cfgStr, &c.CreatedAt, &c.UpdatedAt); err != nil {
		return nil, err
	}
	c.Config = map[string]interface{}{}
	if err := json.Unmarshal([]byte(cfgStr), &c.Config); err != nil {
		return nil, err
	}
	return c, nil
}

func (r *NodeConfigRepo) List() ([]*models.NodeConfig, error) {
	rows, err := r.DB.Query("SELECT id, name, type, config, created_at, updated_at FROM node_configs ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*models.NodeConfig
	for rows.Next() {
		c := &models.NodeConfig{}
		var cfgStr string
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &cfgStr, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		c.Config = map[string]interface{}{}
		if err := json.Unmarshal([]byte(cfgStr), &c.Config); err != nil {
			return nil, err
		}
		configs = append(configs, c)
	}
	return configs, nil
}

func (r *NodeConfigRepo) ListByType(configType string) ([]*models.NodeConfig, error) {
	rows, err := r.DB.Query("SELECT id, name, type, config, created_at, updated_at FROM node_configs WHERE type = ? ORDER BY name ASC", configType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*models.NodeConfig
	for rows.Next() {
		c := &models.NodeConfig{}
		var cfgStr string
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &cfgStr, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		c.Config = map[string]interface{}{}
		if err := json.Unmarshal([]byte(cfgStr), &c.Config); err != nil {
			return nil, err
		}
		configs = append(configs, c)
	}
	return configs, nil
}

func (r *NodeConfigRepo) Update(c *models.NodeConfig) error {
	cfgJSON, err := json.Marshal(c.Config)
	if err != nil {
		return err
	}
	_, err = r.DB.Exec(
		"UPDATE node_configs SET name = ?, type = ?, config = ? WHERE id = ?",
		c.Name, c.Type, string(cfgJSON), c.ID,
	)
	return err
}

func (r *NodeConfigRepo) Delete(id int64) error {
	_, err := r.DB.Exec("DELETE FROM node_configs WHERE id = ?", id)
	return err
}
