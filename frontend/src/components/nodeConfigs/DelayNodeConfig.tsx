import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const DELAY_NODE_DOC: NodeDoc = {
  title: 'Delay',
  description:
    'Pauses the workflow execution for a specified duration in milliseconds before continuing to the next node.',
  usage:
    'Set the duration in milliseconds. The node will wait for that period, then pass all input data through to the next node.',
  properties: [
    { name: 'durationMs', type: 'number', desc: 'Wait time in milliseconds (e.g. 1000 = 1 second)', required: true },
  ],
  sampleInput: { previousResult: 'data from upstream' },
  sampleOutput: {
    previousResult: 'data from upstream',
    delayed: true,
    delayMs: 1000,
    delayedAt: '2026-02-24T10:00:01Z',
  },
  tips: [
    'Use delays between API calls to respect rate limits.',
    'Maximum recommended delay is 300000ms (5 minutes).',
    'All input data is passed through unchanged.',
  ],
};

export default function DelayNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <div>
      <Text strong className="text-[10px] block mb-0.5">Duration (ms)</Text>
      <input
        type="number"
        min={0}
        className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
        value={properties.durationMs ?? 1000}
        onChange={(e) => updateProp('durationMs', e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </div>
  );
}
