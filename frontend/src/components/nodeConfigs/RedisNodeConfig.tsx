import { Input, Select, InputNumber, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';
import { REDIS_OPERATIONS } from './constants';

const { Text } = Typography;
const { TextArea } = Input;

export const REDIS_NODE_DOC: NodeDoc = {
  title: 'Redis',
  description:
    'Executes Redis operations (GET, SET, DEL, HGET, HSET, LPUSH, PUBLISH, etc.) using a configured Redis server connection.',
  usage:
    'Select a Redis server config, choose an operation, and provide the key/value/field as needed. The result of the operation is passed downstream.',
  properties: [
    { name: 'configId', type: 'select', desc: 'Redis server configuration', required: true },
    { name: 'operation', type: 'select', desc: 'Redis command (GET, SET, DEL, HGET, HSET, etc.)', required: true },
    { name: 'key', type: 'string', desc: 'Redis key name', required: true },
    { name: 'value', type: 'string', desc: 'Value to set (for SET, HSET, LPUSH, etc.)', required: false },
    { name: 'field', type: 'string', desc: 'Hash field name (for HGET, HSET, HDEL)', required: false },
    { name: 'ttl', type: 'number', desc: 'TTL in milliseconds (for SET, EXPIRE)', required: false },
  ],
  sampleInput: { userId: '42' },
  sampleOutput: {
    operation: 'GET',
    key: 'user:42',
    result: '{"name":"John","age":30}',
    exists: true,
    json: { name: 'John', age: 30 },
  },
  tips: [
    'Create a Redis config in ⚙ Connection Configs first.',
    'Key and value can come from upstream input if not set in properties.',
    'JSON values are auto-parsed when retrieved with GET.',
    'Use PUBLISH to send messages to Redis pub/sub channels.',
  ],
};

export default function RedisNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
  const redisConfigs = configs?.filter((c) => c.type === 'redis') ?? [];
  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Server Config</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select Redis server..."
          value={properties.configId || undefined}
          onChange={(val) => updateProp('configId', val)}
          options={redisConfigs.map((c) => ({
            value: c.id,
            label: `${c.name} (${c.config?.host || '127.0.0.1'}:${c.config?.port || 6379})`,
          }))}
          notFoundContent={
            <Text type="secondary" style={{ fontSize: 10, padding: 4 }}>
              No Redis configs. Add one in ⚙ Configs.
            </Text>
          }
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Operation</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select operation..."
          value={properties.operation || undefined}
          onChange={(val) => updateProp('operation', val)}
          options={REDIS_OPERATIONS}
        />
      </div>
      {properties.operation && properties.operation !== 'KEYS' && (
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>
            {properties.operation === 'PUBLISH' ? 'Channel' : 'Key'}
          </Text>
          <Input
            size="small"
            placeholder={properties.operation === 'PUBLISH' ? 'channel-name' : 'my-key'}
            value={properties.key || ''}
            onChange={(e) => updateProp('key', e.target.value)}
          />
        </div>
      )}
      {properties.operation === 'KEYS' && (
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Pattern</Text>
          <Input
            size="small"
            placeholder="user:*"
            value={properties.key || ''}
            onChange={(e) => updateProp('key', e.target.value)}
          />
        </div>
      )}
      {['HGET', 'HSET', 'HDEL'].includes(properties.operation) && (
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Field</Text>
          <Input
            size="small"
            placeholder="field-name"
            value={properties.field || ''}
            onChange={(e) => updateProp('field', e.target.value)}
          />
        </div>
      )}
      {['SET', 'HSET', 'LPUSH', 'RPUSH', 'SADD', 'PUBLISH'].includes((properties.operation as string) ?? '') && (
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Value</Text>
          <TextArea
            size="small"
            rows={2}
            placeholder="value"
            value={properties.value || ''}
            onChange={(e) => updateProp('value', e.target.value)}
          />
        </div>
      )}
      {['SET', 'EXPIRE'].includes((properties.operation as string) ?? '') && (
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>TTL (ms)</Text>
          <InputNumber
            size="small"
            style={{ width: '100%' }}
            min={0}
            placeholder="0 = no expiry"
            value={(properties.ttl as number | undefined) ?? undefined}
            onChange={(val) => updateProp('ttl', val)}
          />
        </div>
      )}
      {properties.operation === 'LRANGE' && (
        <>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Start Index</Text>
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              value={properties.start ?? 0}
              onChange={(val) => updateProp('start', val)}
            />
          </div>
          <div>
            <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Stop Index</Text>
            <InputNumber
              size="small"
              style={{ width: '100%' }}
              value={properties.stop ?? -1}
              onChange={(val) => updateProp('stop', val)}
            />
            <Text type="secondary" style={{ fontSize: 10 }}>-1 = all elements</Text>
          </div>
        </>
      )}
    </>
  );
}
