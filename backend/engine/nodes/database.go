package nodes

import (
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strings"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/microsoft/go-mssqldb"
)

var placeholderRE = regexp.MustCompile(`\{\{([^}]+)\}\}`)

// DatabaseNode runs a SQL query or stored procedure against MySQL or SQL Server.
// Query can use {{key}} or {{input.key}} placeholders; values come from upstream input.
type DatabaseNode struct{}

func (n *DatabaseNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, resolveConfig engine.ConfigResolver) (map[string]interface{}, error) {
	props := node.Properties
	if props == nil {
		props = make(map[string]interface{})
	}

	configID, _ := toInt64(props["configId"])
	if configID == 0 {
		return nil, fmt.Errorf("database node: configId is required")
	}

	cfg, err := resolveConfig(configID)
	if err != nil {
		return nil, fmt.Errorf("database node: resolve config: %w", err)
	}
	if cfg.Type != "database" {
		return nil, fmt.Errorf("database node: config %d is not database type (got %s)", configID, cfg.Type)
	}

	driver, _ := cfg.Config["driver"].(string)
	if driver == "" {
		driver = "mysql"
	}
	if driver != "mysql" && driver != "sqlserver" {
		return nil, fmt.Errorf("database node: unsupported driver %q (use mysql or sqlserver)", driver)
	}

	dsn, err := buildDSN(driver, cfg.Config)
	if err != nil {
		return nil, fmt.Errorf("database node: build DSN: %w", err)
	}

	db, err := sql.Open(driver, dsn)
	if err != nil {
		return nil, fmt.Errorf("database node: open: %w", err)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("database node: ping: %w", err)
	}

	query, _ := props["query"].(string)
	if query == "" {
		return nil, fmt.Errorf("database node: query is required")
	}

	mode, _ := props["mode"].(string)
	if mode == "" {
		mode = "query"
	}

	timeoutMs, _ := props["timeoutMs"].(float64)
	if timeoutMs <= 0 {
		timeoutMs = 30000
	}
	runCtx, cancel := context.WithTimeout(ctx, time.Duration(timeoutMs)*time.Millisecond)
	defer cancel()

	// Resolve {{path}} placeholders from input
	execQuery, args, err := resolvePlaceholders(query, input)
	if err != nil {
		return nil, fmt.Errorf("database node: placeholders: %w", err)
	}

	if mode == "procedure" {
		execQuery = wrapProcedure(driver, execQuery)
	}

	rows, err := db.QueryContext(runCtx, execQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("database node: execute: %w", err)
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("database node: columns: %w", err)
	}

	var result []map[string]interface{}
	for rows.Next() {
		dest := make([]interface{}, len(columns))
		destPtr := make([]interface{}, len(columns))
		for i := range dest {
			destPtr[i] = &dest[i]
		}
		if err := rows.Scan(destPtr...); err != nil {
			return nil, fmt.Errorf("database node: scan: %w", err)
		}
		row := make(map[string]interface{})
		for i, col := range columns {
			v := dest[i]
			if b, ok := v.([]byte); ok {
				v = string(b)
			}
			row[col] = v
		}
		result = append(result, row)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("database node: rows: %w", err)
	}

	output := map[string]interface{}{
		"rows":     result,
		"rowCount": len(result),
		"query":    execQuery,
	}
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}
	return output, nil
}

func buildDSN(driver string, cfg map[string]interface{}) (string, error) {
	host, _ := cfg["host"].(string)
	if host == "" {
		host = "127.0.0.1"
	}
	port := 3306
	if driver == "sqlserver" {
		port = 1433
	}
	if p, ok := cfg["port"].(float64); ok && p > 0 {
		port = int(p)
	}
	user, _ := cfg["username"].(string)
	if user == "" {
		user, _ = cfg["user"].(string)
	}
	if user == "" {
		return "", fmt.Errorf("username is required")
	}
	password, _ := cfg["password"].(string)
	database, _ := cfg["database"].(string)
	if database == "" {
		database, _ = cfg["db"].(string)
	}

	switch driver {
	case "mysql":
		return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", user, password, host, port, database), nil
	case "sqlserver":
		// sqlserver://user:password@host:port?database=name
		return fmt.Sprintf("sqlserver://%s:%s@%s:%d?database=%s", user, password, host, port, database), nil
	default:
		return "", fmt.Errorf("unsupported driver %s", driver)
	}
}

// resolvePlaceholders replaces {{path}} with ? and returns the query and args.
// path can be "key" or "input.key" or "a.b.c" for nested input.
func resolvePlaceholders(query string, input map[string]interface{}) (string, []interface{}, error) {
	matches := placeholderRE.FindAllStringSubmatch(query, -1)
	if len(matches) == 0 {
		return query, nil, nil
	}

	var args []interface{}
	for _, m := range matches {
		path := strings.TrimSpace(m[1])
		if strings.HasPrefix(path, "input.") {
			path = path[7:]
		}
		v, err := getNested(input, path)
		if err != nil {
			return "", nil, fmt.Errorf("placeholder {{%s}}: %w", path, err)
		}
		args = append(args, v)
	}

	replaced := placeholderRE.ReplaceAllStringFunc(query, func(_ string) string { return "?" })
	return replaced, args, nil
}

func getNested(m map[string]interface{}, path string) (interface{}, error) {
	parts := strings.Split(path, ".")
	var current interface{} = m
	for _, p := range parts {
		if current == nil {
			return nil, fmt.Errorf("missing path %q", path)
		}
		if mp, ok := current.(map[string]interface{}); ok {
			current = mp[p]
			continue
		}
		return nil, fmt.Errorf("path %q not a map at %q", path, p)
	}
	return current, nil
}

func wrapProcedure(driver, nameOrQuery string) string {
	nameOrQuery = strings.TrimSpace(nameOrQuery)
	if nameOrQuery == "" {
		return nameOrQuery
	}
	upper := strings.ToUpper(nameOrQuery)
	if strings.HasPrefix(upper, "CALL ") || strings.HasPrefix(upper, "EXEC ") {
		return nameOrQuery
	}
	if driver == "mysql" {
		return "CALL " + nameOrQuery
	}
	return "EXEC " + nameOrQuery
}
