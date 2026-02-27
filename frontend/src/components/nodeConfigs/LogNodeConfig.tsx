import { Input, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

export const LOG_NODE_DOC: NodeDoc = {
  title: 'Log',
  description:
    'Logs a message to the execution log. Useful for debugging workflows or recording important data at specific points in the flow.',
  usage:
    'Enter a message to log. The message and all input data are recorded in the execution log and also passed downstream.',
  properties: [
    { name: 'message', type: 'string', desc: 'Message to log', required: true },
  ],
  sampleInput: { userId: 42, action: 'created' },
  sampleOutput: {
    logged: true,
    message: 'User created successfully',
    userId: 42,
    action: 'created',
  },
  tips: [
    'Log nodes are great for debugging — view output in Execution History.',
    'All input data is passed through to the next node.',
  ],
};

export default function LogNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <div>
      <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Message</Text>
      <TextArea
        size="small"
        rows={2}
        placeholder="Log message..."
        value={properties.message || ''}
        onChange={(e) => updateProp('message', e.target.value)}
      />
    </div>
  );
}
