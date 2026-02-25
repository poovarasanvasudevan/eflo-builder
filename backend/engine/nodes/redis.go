package nodes

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"eflo/backend/engine"
	"eflo/backend/models"

	"github.com/redis/go-redis/v9"
)

type RedisNode struct{}

func (n *RedisNode) Execute(ctx context.Context, node models.NodeDef, input map[string]interface{}, resolveConfig engine.ConfigResolver) (map[string]interface{}, error) {
	// Resolve Redis config
	configIDRaw, ok := node.Properties["configId"]
	if !ok {
		return nil, fmt.Errorf("redis node: configId is required")
	}
	configID, err := toInt64(configIDRaw)
	if err != nil {
		return nil, fmt.Errorf("redis node: invalid configId: %w", err)
	}

	cfg, err := resolveConfig(configID)
	if err != nil {
		return nil, fmt.Errorf("redis node: failed to resolve config %d: %w", configID, err)
	}
	if cfg.Type != "redis" {
		return nil, fmt.Errorf("redis node: config %d is not a redis config (got %s)", configID, cfg.Type)
	}

	// Build redis client from config
	host, _ := cfg.Config["host"].(string)
	if host == "" {
		host = "127.0.0.1"
	}
	port, _ := cfg.Config["port"].(string)
	if port == "" {
		// port might come as float64 from JSON
		if pf, ok := cfg.Config["port"].(float64); ok {
			port = strconv.Itoa(int(pf))
		} else {
			port = "6379"
		}
	}
	password, _ := cfg.Config["password"].(string)
	dbNum := 0
	if dbRaw, ok := cfg.Config["db"]; ok {
		if dbf, ok := dbRaw.(float64); ok {
			dbNum = int(dbf)
		}
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     host + ":" + port,
		Password: password,
		DB:       dbNum,
	})
	defer rdb.Close()

	// Test connection
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis node: connection failed: %w", err)
	}

	operation, _ := node.Properties["operation"].(string)
	if operation == "" {
		return nil, fmt.Errorf("redis node: operation is required")
	}

	key, _ := node.Properties["key"].(string)
	value, _ := node.Properties["value"].(string)
	field, _ := node.Properties["field"].(string)

	// Allow key/value from upstream input if not set in properties
	if key == "" {
		if k, ok := input["key"].(string); ok {
			key = k
		}
	}
	if value == "" {
		if v, ok := input["value"].(string); ok {
			value = v
		}
	}

	output := map[string]interface{}{
		"operation": operation,
		"key":       key,
	}

	switch operation {
	case "GET":
		if key == "" {
			return nil, fmt.Errorf("redis GET: key is required")
		}
		val, err := rdb.Get(ctx, key).Result()
		if err == redis.Nil {
			output["result"] = nil
			output["exists"] = false
		} else if err != nil {
			return nil, fmt.Errorf("redis GET failed: %w", err)
		} else {
			output["result"] = val
			output["exists"] = true
			// Try to parse as JSON
			var jsonVal interface{}
			if json.Unmarshal([]byte(val), &jsonVal) == nil {
				output["json"] = jsonVal
			}
		}

	case "SET":
		if key == "" {
			return nil, fmt.Errorf("redis SET: key is required")
		}
		ttlMs, _ := node.Properties["ttl"].(float64)
		var expiration time.Duration
		if ttlMs > 0 {
			expiration = time.Duration(ttlMs) * time.Millisecond
		}
		err := rdb.Set(ctx, key, value, expiration).Err()
		if err != nil {
			return nil, fmt.Errorf("redis SET failed: %w", err)
		}
		output["result"] = "OK"

	case "DEL":
		if key == "" {
			return nil, fmt.Errorf("redis DEL: key is required")
		}
		deleted, err := rdb.Del(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis DEL failed: %w", err)
		}
		output["result"] = deleted

	case "KEYS":
		pattern := key
		if pattern == "" {
			pattern = "*"
		}
		keys, err := rdb.Keys(ctx, pattern).Result()
		if err != nil {
			return nil, fmt.Errorf("redis KEYS failed: %w", err)
		}
		output["result"] = keys
		output["count"] = len(keys)

	case "HGET":
		if key == "" || field == "" {
			return nil, fmt.Errorf("redis HGET: key and field are required")
		}
		val, err := rdb.HGet(ctx, key, field).Result()
		if err == redis.Nil {
			output["result"] = nil
			output["exists"] = false
		} else if err != nil {
			return nil, fmt.Errorf("redis HGET failed: %w", err)
		} else {
			output["result"] = val
			output["exists"] = true
		}

	case "HSET":
		if key == "" || field == "" {
			return nil, fmt.Errorf("redis HSET: key and field are required")
		}
		err := rdb.HSet(ctx, key, field, value).Err()
		if err != nil {
			return nil, fmt.Errorf("redis HSET failed: %w", err)
		}
		output["result"] = "OK"

	case "HGETALL":
		if key == "" {
			return nil, fmt.Errorf("redis HGETALL: key is required")
		}
		vals, err := rdb.HGetAll(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis HGETALL failed: %w", err)
		}
		output["result"] = vals

	case "HDEL":
		if key == "" || field == "" {
			return nil, fmt.Errorf("redis HDEL: key and field are required")
		}
		deleted, err := rdb.HDel(ctx, key, field).Result()
		if err != nil {
			return nil, fmt.Errorf("redis HDEL failed: %w", err)
		}
		output["result"] = deleted

	case "LPUSH":
		if key == "" || value == "" {
			return nil, fmt.Errorf("redis LPUSH: key and value are required")
		}
		length, err := rdb.LPush(ctx, key, value).Result()
		if err != nil {
			return nil, fmt.Errorf("redis LPUSH failed: %w", err)
		}
		output["result"] = length

	case "RPUSH":
		if key == "" || value == "" {
			return nil, fmt.Errorf("redis RPUSH: key and value are required")
		}
		length, err := rdb.RPush(ctx, key, value).Result()
		if err != nil {
			return nil, fmt.Errorf("redis RPUSH failed: %w", err)
		}
		output["result"] = length

	case "LPOP":
		if key == "" {
			return nil, fmt.Errorf("redis LPOP: key is required")
		}
		val, err := rdb.LPop(ctx, key).Result()
		if err == redis.Nil {
			output["result"] = nil
		} else if err != nil {
			return nil, fmt.Errorf("redis LPOP failed: %w", err)
		} else {
			output["result"] = val
		}

	case "RPOP":
		if key == "" {
			return nil, fmt.Errorf("redis RPOP: key is required")
		}
		val, err := rdb.RPop(ctx, key).Result()
		if err == redis.Nil {
			output["result"] = nil
		} else if err != nil {
			return nil, fmt.Errorf("redis RPOP failed: %w", err)
		} else {
			output["result"] = val
		}

	case "LRANGE":
		if key == "" {
			return nil, fmt.Errorf("redis LRANGE: key is required")
		}
		start := int64(0)
		stop := int64(-1)
		if s, ok := node.Properties["start"].(float64); ok {
			start = int64(s)
		}
		if s, ok := node.Properties["stop"].(float64); ok {
			stop = int64(s)
		}
		vals, err := rdb.LRange(ctx, key, start, stop).Result()
		if err != nil {
			return nil, fmt.Errorf("redis LRANGE failed: %w", err)
		}
		output["result"] = vals
		output["count"] = len(vals)

	case "PUBLISH":
		channel, _ := node.Properties["channel"].(string)
		if channel == "" {
			channel = key
		}
		if channel == "" {
			return nil, fmt.Errorf("redis PUBLISH: channel is required")
		}
		receivers, err := rdb.Publish(ctx, channel, value).Result()
		if err != nil {
			return nil, fmt.Errorf("redis PUBLISH failed: %w", err)
		}
		output["result"] = receivers
		output["channel"] = channel

	case "INCR":
		if key == "" {
			return nil, fmt.Errorf("redis INCR: key is required")
		}
		val, err := rdb.Incr(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis INCR failed: %w", err)
		}
		output["result"] = val

	case "DECR":
		if key == "" {
			return nil, fmt.Errorf("redis DECR: key is required")
		}
		val, err := rdb.Decr(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis DECR failed: %w", err)
		}
		output["result"] = val

	case "EXPIRE":
		if key == "" {
			return nil, fmt.Errorf("redis EXPIRE: key is required")
		}
		ttlMs, _ := node.Properties["ttl"].(float64)
		if ttlMs <= 0 {
			return nil, fmt.Errorf("redis EXPIRE: ttl is required")
		}
		ok, err := rdb.Expire(ctx, key, time.Duration(ttlMs)*time.Millisecond).Result()
		if err != nil {
			return nil, fmt.Errorf("redis EXPIRE failed: %w", err)
		}
		output["result"] = ok

	case "TTL":
		if key == "" {
			return nil, fmt.Errorf("redis TTL: key is required")
		}
		ttl, err := rdb.TTL(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis TTL failed: %w", err)
		}
		output["result"] = ttl.Milliseconds()

	case "EXISTS":
		if key == "" {
			return nil, fmt.Errorf("redis EXISTS: key is required")
		}
		count, err := rdb.Exists(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis EXISTS failed: %w", err)
		}
		output["result"] = count > 0
		output["count"] = count

	case "SADD":
		if key == "" || value == "" {
			return nil, fmt.Errorf("redis SADD: key and value are required")
		}
		added, err := rdb.SAdd(ctx, key, value).Result()
		if err != nil {
			return nil, fmt.Errorf("redis SADD failed: %w", err)
		}
		output["result"] = added

	case "SMEMBERS":
		if key == "" {
			return nil, fmt.Errorf("redis SMEMBERS: key is required")
		}
		members, err := rdb.SMembers(ctx, key).Result()
		if err != nil {
			return nil, fmt.Errorf("redis SMEMBERS failed: %w", err)
		}
		output["result"] = members
		output["count"] = len(members)

	default:
		return nil, fmt.Errorf("redis node: unsupported operation: %s", operation)
	}

	// Forward input data
	for k, v := range input {
		if _, exists := output[k]; !exists {
			output[k] = v
		}
	}

	return output, nil
}

func toInt64(v interface{}) (int64, error) {
	switch val := v.(type) {
	case float64:
		return int64(val), nil
	case int64:
		return val, nil
	case int:
		return int64(val), nil
	case string:
		return strconv.ParseInt(val, 10, 64)
	case json.Number:
		return val.Int64()
	default:
		return 0, fmt.Errorf("cannot convert %T to int64", v)
	}
}
