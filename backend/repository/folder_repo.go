package repository

import (
	"database/sql"

	"eflo/backend/models"
)

type FolderRepo struct {
	DB *sql.DB
}

func NewFolderRepo(db *sql.DB) *FolderRepo {
	return &FolderRepo{DB: db}
}

func (r *FolderRepo) Create(f *models.WorkflowFolder) (int64, error) {
	res, err := r.DB.Exec(
		"INSERT INTO workflow_folders (name, parent_id) VALUES (?, ?)",
		f.Name, f.ParentID,
	)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (r *FolderRepo) GetByID(id int64) (*models.WorkflowFolder, error) {
	row := r.DB.QueryRow(
		"SELECT id, name, parent_id, created_at, updated_at FROM workflow_folders WHERE id = ?",
		id,
	)
	f := &models.WorkflowFolder{}
	if err := row.Scan(&f.ID, &f.Name, &f.ParentID, &f.CreatedAt, &f.UpdatedAt); err != nil {
		return nil, err
	}
	return f, nil
}

func (r *FolderRepo) List() ([]*models.WorkflowFolder, error) {
	rows, err := r.DB.Query(
		"SELECT id, name, parent_id, created_at, updated_at FROM workflow_folders ORDER BY name",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*models.WorkflowFolder
	for rows.Next() {
		f := &models.WorkflowFolder{}
		if err := rows.Scan(&f.ID, &f.Name, &f.ParentID, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		list = append(list, f)
	}
	return list, nil
}

func (r *FolderRepo) Update(f *models.WorkflowFolder) error {
	_, err := r.DB.Exec(
		"UPDATE workflow_folders SET name = ?, parent_id = ? WHERE id = ?",
		f.Name, f.ParentID, f.ID,
	)
	return err
}

// Delete removes the folder. Child folders are reparented to this folder's parent;
// workflows in this folder have their folder_id set to this folder's parent (or NULL).
func (r *FolderRepo) Delete(id int64) error {
	f, err := r.GetByID(id)
	if err != nil {
		return err
	}
	// Reparent child folders
	if _, err := r.DB.Exec(
		"UPDATE workflow_folders SET parent_id = ? WHERE parent_id = ?",
		f.ParentID, id,
	); err != nil {
		return err
	}
	// Move workflows to parent (or root)
	if _, err := r.DB.Exec(
		"UPDATE workflows SET folder_id = ? WHERE folder_id = ?",
		f.ParentID, id,
	); err != nil {
		return err
	}
	_, err = r.DB.Exec("DELETE FROM workflow_folders WHERE id = ?", id)
	return err
}
