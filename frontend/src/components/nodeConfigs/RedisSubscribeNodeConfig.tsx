import { Input, Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Channel / Pattern</Text>
        <Input
          size="small"
          placeholder="my-channel or my-*"
          value={properties.channel || ''}
          onChange={(e) => updateProp('channel', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Mode</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={properties.isPattern ? 'pattern' : 'channel'}
          onChange={(val) => updateProp('isPattern', val === 'pattern')}
          options={[
            { value: 'channel', label: 'SUBSCRIBE — exact channel' },
            { value: 'pattern', label: 'PSUBSCRIBE — glob pattern' },
          ]}
        />
        <Text type="secondary" style={{ fontSize: 9 }}>
          Pattern mode supports * and ? wildcards.
        </Text>
      </div>
    </>
  );
}
