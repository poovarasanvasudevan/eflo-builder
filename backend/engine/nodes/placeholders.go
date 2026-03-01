package nodes

import (
	"fmt"
	"regexp"
	"strings"
)

var resolvePlaceholderRE = regexp.MustCompile(`\{\{([^}]+)\}\}`)

// GetNested returns a value from a nested map using dot path (e.g. "config.token", "input.userId").
func GetNested(m map[string]interface{}, path string) (interface{}, error) {
	path = strings.TrimSpace(path)
	if path == "" {
		return nil, fmt.Errorf("empty path")
	}
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

// ResolvePlaceholders replaces {{path}} in s with values from input (e.g. {{config.token}}, {{input.userId}}).
func ResolvePlaceholders(s string, input map[string]interface{}) (string, error) {
	if input == nil {
		input = map[string]interface{}{}
	}
	var errOut error
	out := resolvePlaceholderRE.ReplaceAllStringFunc(s, func(match string) string {
		sub := resolvePlaceholderRE.FindStringSubmatch(match)
		if len(sub) < 2 {
			return match
		}
		path := strings.TrimSpace(sub[1])
		v, err := GetNested(input, path)
		if err != nil {
			errOut = err
			return match
		}
		if v == nil {
			return ""
		}
		return fmt.Sprintf("%v", v)
	})
	return out, errOut
}
