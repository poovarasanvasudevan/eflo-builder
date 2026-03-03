import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

export const REDIS_SUBSCRIBE_NODE_DOC: NodeDoc = {
  title: 'Redis Subscribe Trigger',
  description:
    'A trigger node that starts a workflow when a message is received on a Redis pub/sub channel. Acts as an entry point for event-driven flows.',
  usage:
    'Select a Redis server config, set the channel name or pattern, and choose SUBSCRIBE (exact) or PSUBSCRIBE (glob pattern). Then create a subscription in the 🔔 Redis Subscriptions manager.',
  properties: [
    { name: 'configId', type: 'select', desc: 'Redis server configuration', required: true },
    { name: 'channel', type: 'string', desc: 'Channel name or glob pattern', required: true },
    { name: 'isPattern', type: 'boolean', desc: 'Use PSUBSCRIBE for pattern matching', required: false },
  ],
  sampleInput: {},
  sampleOutput: {
    triggered: true,
    triggeredAt: '2026-02-24T10:00:00Z',
    message: '{"event":"user.created","userId":42}',
    channel: 'events',
    pattern: '',
    subscriptionId: 1,
  },
  tips: [
    'Use PSUBSCRIBE with patterns like "events:*" to match multiple channels.',
    'The message payload is available as the "message" field.',
    'Create a subscription via the 🔔 toolbar button to activate.',
    'Each received message triggers a separate workflow execution.',
  ],
};

export default function RedisSubscribeNodeConfig({ properties, updateProp, configs }: NodeConfigProps) {
  const redisConfigs = configs?.filter((c) => c.type === 'redis') ?? [];
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
        <Text strong className="text-[10px] block mb-0.5">Channel / Pattern</Text>
        <TextField
          placeholder="my-channel or my-*"
          value={(properties.channel as string) || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('channel', e.target.value)}
        />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Mode</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.isPattern ? 'pattern' : 'channel'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('isPattern', e.target.value === 'pattern')}
        >
          <option value="channel">SUBSCRIBE — exact channel</option>
          <option value="pattern">PSUBSCRIBE — glob pattern</option>
        </select>
        <Text className="text-[9px] text-[#706e6b]">Pattern mode supports * and ? wildcards.</Text>
      </div>
    </>
  );
}
