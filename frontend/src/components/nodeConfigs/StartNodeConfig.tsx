import { Typography } from 'antd';
import type { NodeDoc } from './types';

const { Text } = Typography;

export const START_NODE_DOC: NodeDoc = {
  title: 'Start',
  description:
    'The entry point of every workflow. Execution begins from this node and flows downstream through connected edges. Every workflow must have exactly one Start node.',
  usage:
    'Drag the Start node onto the canvas. Connect its output to the first action node. No configuration is needed — it simply initiates the flow.',
  properties: [
    { name: 'label', type: 'string', desc: 'Display label for the node', required: false },
  ],
  sampleInput: {},
  sampleOutput: {
    started: true,
    startedAt: '2026-02-24T10:00:00Z',
  },
  tips: [
    'A workflow can only have one Start node.',
    'Start nodes have no target handle — they are always the first node.',
    'Use Cron or Redis Subscribe triggers as alternatives to Start for event-driven flows.',
  ],
};

export default function StartNodeConfig() {
  return (
    <Text type="secondary" style={{ fontSize: 11 }}>
      Start node has no configurable properties.
    </Text>
  );
}
