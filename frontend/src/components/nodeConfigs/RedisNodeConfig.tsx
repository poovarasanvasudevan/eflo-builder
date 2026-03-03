import type { NodeConfigProps, NodeDoc } from './types';
import { REDIS_OPERATIONS } from './constants';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

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

const FLAT_OPERATIONS = (REDIS_OPERATIONS as { options?: { value: string; label: string }[] }[]).flatMap((g) => g.options ?? []);

export default function RedisNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
  const redisConfigs = configs?.filter((c) => c.type === 'redis') ?? [];
  const op = (properties.operation as string) ?? '';
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Server Config</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.configId != null ? String(properties.configId) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('configId', e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Select Redis server...</option>
          {redisConfigs.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({(c.config as { host?: string })?.host || '127.0.0.1'}:{(c.config as { port?: number })?.port || 6379})</option>
          ))}
        </select>
        {redisConfigs.length === 0 && <Text className="text-[10px] text-[#706e6b] block mt-0.5">No Redis configs. Add one in ⚙ Configs.</Text>}
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Operation</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={(properties.operation as string) || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('operation', e.target.value || undefined)}
        >
          <option value="">Select operation...</option>
          {FLAT_OPERATIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      {op && op !== 'KEYS' && (
        <div>
          <Text strong className="text-[10px] block mb-0.5">{op === 'PUBLISH' ? 'Channel' : 'Key'}</Text>
          <TextField
            placeholder={op === 'PUBLISH' ? 'channel-name' : 'my-key'}
            value={(properties.key as string) || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('key', e.target.value)}
          />
        </div>
      )}
      {op === 'KEYS' && (
        <div>
          <Text strong className="text-[10px] block mb-0.5">Pattern</Text>
          <TextField
            placeholder="user:*"
            value={(properties.key as string) || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('key', e.target.value)}
          />
        </div>
      )}
      {['HGET', 'HSET', 'HDEL'].includes(op) && (
        <div>
          <Text strong className="text-[10px] block mb-0.5">Field</Text>
          <TextField
            placeholder="field-name"
            value={(properties.field as string) || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('field', e.target.value)}
          />
        </div>
      )}
      {['SET', 'HSET', 'LPUSH', 'RPUSH', 'SADD', 'PUBLISH'].includes(op) && (
        <div>
          <Text strong className="text-[10px] block mb-0.5">Value</Text>
          <textarea
            className="w-full min-h-[40px] p-2 border border-[#dfe1e6] rounded text-xs resize-y"
            placeholder="value"
            value={(properties.value as string) || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProp('value', e.target.value)}
            rows={2}
          />
        </div>
      )}
      {['SET', 'EXPIRE'].includes(op) && (
        <div>
          <Text strong className="text-[10px] block mb-0.5">TTL (ms)</Text>
          <input
            type="number"
            min={0}
            className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
            placeholder="0 = no expiry"
            value={(properties.ttl as number | undefined) ?? ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('ttl', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </div>
      )}
      {op === 'LRANGE' && (
        <>
          <div>
            <Text strong className="text-[10px] block mb-0.5">Start Index</Text>
            <input
              type="number"
              className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
              value={properties.start ?? 0}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('start', Number(e.target.value))}
            />
          </div>
          <div>
            <Text strong className="text-[10px] block mb-0.5">Stop Index</Text>
            <input
              type="number"
              className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
              value={properties.stop ?? -1}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('stop', Number(e.target.value))}
            />
            <Text className="text-[10px] text-[#706e6b]">-1 = all elements</Text>
          </div>
        </>
      )}
    </>
  );
}
