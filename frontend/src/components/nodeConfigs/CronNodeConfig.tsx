import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';
import TextField from '@atlaskit/textfield';

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
  const payloadStr = typeof properties.payload === 'string' ? properties.payload : (properties.payload ? JSON.stringify(properties.payload) : '');
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Preset</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value=""
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { const val = e.target.value; if (val) updateProp('expression', val); }}
        >
          <option value="">Choose a preset...</option>
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Cron Expression</Text>
        <TextField
          placeholder="* * * * *"
          value={(properties.expression as string) || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('expression', e.target.value)}
          className="font-mono"
        />
        <Text className="text-[9px] text-[#706e6b] block mt-0.5">min hour dom month dow</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Timezone</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={(properties.timezone as string) || 'UTC'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('timezone', e.target.value)}
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Payload (optional)</Text>
        <textarea
          className="w-full min-h-[40px] p-2 border border-[#dfe1e6] rounded text-[10px] font-mono resize-y"
          placeholder='{"key": "value"}'
          value={payloadStr}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateProp('payload', e.target.value)}
          rows={2}
        />
        <Text className="text-[10px] text-[#706e6b]">JSON payload passed to downstream nodes.</Text>
      </div>
    </>
  );
}
