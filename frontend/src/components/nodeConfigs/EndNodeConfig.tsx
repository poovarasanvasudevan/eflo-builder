import { Typography } from 'antd';
import type { NodeDoc } from './types';

const { Text } = Typography;

export const END_NODE_DOC: NodeDoc = {
  title: 'End',
  description:
    'Marks the termination point of a workflow branch. When execution reaches this node, that path is considered complete. A workflow can have multiple End nodes for different branches.',
  usage:
    'Place an End node at the end of each workflow branch. It passes through any data it receives unchanged.',
  properties: [
    { name: 'label', type: 'string', desc: 'Display label for the node', required: false },
  ],
  sampleInput: {
    result: 'success',
    data: { userId: 42 },
  },
  sampleOutput: {
    result: 'success',
    data: { userId: 42 },
    ended: true,
    endedAt: '2026-02-24T10:00:05Z',
  },
};

export default function EndNodeConfig() {
  return (
    <Text type="secondary" style={{ fontSize: 11 }}>
      End node passes through data. No configuration needed.
    </Text>
  );
}
