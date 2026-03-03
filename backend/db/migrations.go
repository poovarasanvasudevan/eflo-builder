package db

import (
	"database/sql"
	"strings"
)

func isDuplicateColumnOrConstraint(err error) bool {
	if err == nil {
		return false
	}
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "duplicate column") ||
		strings.Contains(s, "duplicate key") ||
		strings.Contains(s, "duplicate foreign key") ||
		strings.Contains(s, "errno 1060") ||
		strings.Contains(s, "errno 1061") ||
		strings.Contains(s, "errno 1826") ||
		strings.Contains(s, "error 1826") // duplicate foreign key constraint name
}

func RunMigrations(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS workflows (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			definition JSON,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS executions (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			workflow_id BIGINT NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'pending',
			started_at TIMESTAMP NULL,
			finished_at TIMESTAMP NULL,
			error TEXT,
			FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS execution_logs (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			execution_id BIGINT NOT NULL,
			node_id VARCHAR(255) NOT NULL,
			node_type VARCHAR(100) NOT NULL,
			status VARCHAR(50) NOT NULL,
			input JSON,
			output JSON,
			error TEXT,
			executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS node_configs (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(100) NOT NULL,
			config JSON,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS cron_schedules (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			workflow_id BIGINT NOT NULL,
			expression VARCHAR(255) NOT NULL,
			timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			last_run_at TIMESTAMP NULL,
			next_run_at TIMESTAMP NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS redis_subscriptions (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			workflow_id BIGINT NOT NULL,
			config_id BIGINT NOT NULL,
			channel VARCHAR(500) NOT NULL,
			is_pattern BOOLEAN NOT NULL DEFAULT FALSE,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			last_msg_at TIMESTAMP NULL,
			msg_count BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
			FOREIGN KEY (config_id) REFERENCES node_configs(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS email_triggers (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			workflow_id BIGINT NOT NULL,
			config_id BIGINT NOT NULL,
			mailbox VARCHAR(255) NOT NULL DEFAULT 'INBOX',
			poll_interval_sec INT NOT NULL DEFAULT 60,
			mark_seen BOOLEAN NOT NULL DEFAULT TRUE,
			max_fetch INT NOT NULL DEFAULT 10,
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			last_poll_at TIMESTAMP NULL,
			msg_count BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
			FOREIGN KEY (config_id) REFERENCES node_configs(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS http_triggers (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			workflow_id BIGINT NOT NULL,
			path VARCHAR(500) NOT NULL,
			method VARCHAR(20) NOT NULL DEFAULT 'POST',
			enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
			UNIQUE KEY uq_http_trigger_path_method (path, method)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		"CREATE TABLE IF NOT EXISTS config_store (" +
			"`key` VARCHAR(255) NOT NULL PRIMARY KEY," +
			"value TEXT NOT NULL," +
			"description VARCHAR(500) DEFAULT ''," +
			"created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
			"updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

		`CREATE TABLE IF NOT EXISTS workflow_folders (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			parent_id BIGINT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (parent_id) REFERENCES workflow_folders(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

		`CREATE TABLE IF NOT EXISTS kb_articles (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(500) NOT NULL,
			slug VARCHAR(500) NOT NULL,
			summary VARCHAR(1000) DEFAULT '',
			content JSON,
			parent_id BIGINT NULL,
			space_key VARCHAR(100) NOT NULL DEFAULT 'main',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (parent_id) REFERENCES kb_articles(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}

	// Add folder_id to workflows if not present (for existing DBs)
	alterQueries := []string{
		"ALTER TABLE workflows ADD COLUMN folder_id BIGINT NULL",
		"ALTER TABLE workflows ADD CONSTRAINT fk_workflow_folder FOREIGN KEY (folder_id) REFERENCES workflow_folders(id) ON DELETE SET NULL",
	}
	for _, q := range alterQueries {
		if _, err := db.Exec(q); err != nil {
			if !isDuplicateColumnOrConstraint(err) {
				return err
			}
		}
	}
	return nil
}
