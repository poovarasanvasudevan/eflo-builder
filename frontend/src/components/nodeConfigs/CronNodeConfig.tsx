import { Input, Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

export const CRON_NODE_DOC: NodeDoc = {
  title: 'Cron Trigger',
  description:
    'A trigger node that starts a workflow on a cron schedule. Acts as an entry point — use instead of Start for time-based automation.',
  usage:
    'Set a cron expression (e.g. "*/5 * * * *" for every 5 minutes). Optionally set a timezone and a JSON payload to inject into the flow. Then create a Schedule in the Cron Schedules manager to activate it.',
  properties: [
    { name: 'expression', type: 'string', desc: 'Cron expression (min hour dom month dow)', required: true },
    { name: 'timezone', type: 'select', desc: 'Timezone for the schedule (default: UTC)', required: false },
    { name: 'payload', type: 'json', desc: 'Optional JSON data passed to downstream nodes', required: false },
  ],
  sampleInput: {},
  sampleOutput: {
    triggered: true,
    triggeredAt: '2026-02-24T10:00:00Z',
    nextRun: '2026-02-24T10:05:00Z',
    expression: '*/5 * * * *',
    timezone: 'UTC',
  },
  tips: [
    'Common presets: "* * * * *" (every min), "0 * * * *" (hourly), "0 0 * * *" (daily).',
    'Remember to create a Schedule via the 🕐 toolbar button to activate.',
    'The cron node acts as a trigger — it has no target handle.',
  ],
};

const PRESETS = [
  { value: '* * * * *', label: 'Every minute' },
  { value: '*/5 * * * *', label: 'Every 5 minutes' },
  { value: '*/15 * * * *', label: 'Every 15 minutes' },
  { value: '*/30 * * * *', label: 'Every 30 minutes' },
  { value: '0 * * * *', label: 'Every hour' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
  { value: '0 */12 * * *', label: 'Every 12 hours' },
  { value: '0 0 * * *', label: 'Daily at midnight' },
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 0 * * 1', label: 'Weekly (Monday midnight)' },
  { value: '0 0 1 * *', label: 'Monthly (1st midnight)' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'US Eastern' },
  { value: 'America/Chicago', label: 'US Central' },
  { value: 'America/Denver', label: 'US Mountain' },
  { value: 'America/Los_Angeles', label: 'US Pacific' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

export default function CronNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Preset</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Choose a preset..."
          allowClear
          value={undefined as string | undefined}
          onChange={(val) => val != null && updateProp('expression', val)}
          options={PRESETS}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Cron Expression</Text>
        <Input
          size="small"
          style={{ fontFamily: 'monospace' }}
          placeholder="* * * * *"
          value={properties.expression || ''}
          onChange={(e) => updateProp('expression', e.target.value)}
        />
        <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 2 }}>
          min hour dom month dow
        </Text>
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Timezone</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          showSearch
          value={(properties.timezone as string) || 'UTC'}
          onChange={(val) => updateProp('timezone', val)}
          options={TIMEZONES}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Payload (optional)</Text>
        <Input.TextArea
          size="small"
          rows={2}
          style={{ fontFamily: 'monospace', fontSize: 10 }}
          placeholder='{"key": "value"}'
          value={properties.payload || ''}
          onChange={(e) => updateProp('payload', e.target.value)}
        />
        <Text type="secondary" style={{ fontSize: 10 }}>
          JSON payload passed to downstream nodes.
        </Text>
      </div>
    </>
  );
}
