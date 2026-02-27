import { InputNumber, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

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
      <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Duration (ms)</Text>
      <InputNumber
        size="small"
        style={{ width: '100%' }}
        min={0}
        value={properties.durationMs || 1000}
        onChange={(val) => updateProp('durationMs', val)}
      />
    </div>
  );
}
