export const REDIS_OPERATIONS = [
  { label: '── String ──', options: [
    { value: 'GET', label: 'GET — Get value' },
    { value: 'SET', label: 'SET — Set value' },
    { value: 'INCR', label: 'INCR — Increment' },
    { value: 'DECR', label: 'DECR — Decrement' },
  ]},
  { label: '── Hash ──', options: [
    { value: 'HGET', label: 'HGET — Get hash field' },
    { value: 'HSET', label: 'HSET — Set hash field' },
    { value: 'HGETALL', label: 'HGETALL — Get all fields' },
    { value: 'HDEL', label: 'HDEL — Delete hash field' },
  ]},
  { label: '── List ──', options: [
    { value: 'LPUSH', label: 'LPUSH — Push left' },
    { value: 'RPUSH', label: 'RPUSH — Push right' },
    { value: 'LPOP', label: 'LPOP — Pop left' },
    { value: 'RPOP', label: 'RPOP — Pop right' },
    { value: 'LRANGE', label: 'LRANGE — Get range' },
  ]},
  { label: '── Set ──', options: [
    { value: 'SADD', label: 'SADD — Add to set' },
    { value: 'SMEMBERS', label: 'SMEMBERS — Get members' },
  ]},
  { label: '── Key ──', options: [
    { value: 'DEL', label: 'DEL — Delete key' },
    { value: 'KEYS', label: 'KEYS — Find keys' },
    { value: 'EXISTS', label: 'EXISTS — Check exists' },
    { value: 'EXPIRE', label: 'EXPIRE — Set expiry' },
    { value: 'TTL', label: 'TTL — Get TTL' },
  ]},
  { label: '── Pub/Sub ──', options: [
    { value: 'PUBLISH', label: 'PUBLISH — Publish message' },
  ]},
];
