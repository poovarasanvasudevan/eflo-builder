package nodes

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"eflo/backend/engine"
	"eflo/backend/models"
)

// ReadFileNode reads a file from disk and outputs its contents.
type ReadFileNode struct{}

func (n *ReadFileNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	filePath := getStringPropOrInput(node.Properties, input, "path")
	if filePath == "" {
		return nil, fmt.Errorf("read_file node: 'path' is required")
	}

	encoding, _ := node.Properties["encoding"].(string)
	if encoding == "" {
		encoding = "utf-8"
	}

	// Clean and resolve path
	filePath = filepath.Clean(filePath)

	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("read_file node: failed to read %s: %w", filePath, err)
	}

	info, _ := os.Stat(filePath)
	output := map[string]interface{}{
		"content":  string(data),
		"path":     filePath,
		"size":     len(data),
		"encoding": encoding,
	}
	if info != nil {
		output["filename"] = info.Name()
		output["isDir"] = info.IsDir()
		output["modTime"] = info.ModTime().String()
	}

	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}
	return output, nil
}

// WriteFileNode writes content to a file on disk.
type WriteFileNode struct{}

func (n *WriteFileNode) Execute(_ context.Context, node models.NodeDef, input map[string]interface{}, _ engine.ConfigResolver) (map[string]interface{}, error) {
	filePath := getStringPropOrInput(node.Properties, input, "path")
	if filePath == "" {
		return nil, fmt.Errorf("write_file node: 'path' is required")
	}

	content := getStringPropOrInput(node.Properties, input, "content")

	// Determine write mode
	mode, _ := node.Properties["mode"].(string)
	if mode == "" {
		mode = "overwrite"
	}

	filePath = filepath.Clean(filePath)

	// Ensure directory exists
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("write_file node: failed to create directory %s: %w", dir, err)
	}

	var flag int
	switch mode {
	case "append":
		flag = os.O_WRONLY | os.O_CREATE | os.O_APPEND
	default: // overwrite
		flag = os.O_WRONLY | os.O_CREATE | os.O_TRUNC
	}

	f, err := os.OpenFile(filePath, flag, 0644)
	if err != nil {
		return nil, fmt.Errorf("write_file node: failed to open %s: %w", filePath, err)
	}
	defer f.Close()

	written, err := f.WriteString(content)
	if err != nil {
		return nil, fmt.Errorf("write_file node: failed to write: %w", err)
	}

	output := map[string]interface{}{
		"written":  true,
		"path":     filePath,
		"bytes":    written,
		"mode":     mode,
		"filename": filepath.Base(filePath),
	}
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}
	return output, nil
}

func getStringPropOrInput(props map[string]interface{}, input map[string]interface{}, key string) string {
	if v, ok := props[key].(string); ok && v != "" {
		return v
	}
	if v, ok := input[key].(string); ok && v != "" {
		return v
	}
	return ""
}
