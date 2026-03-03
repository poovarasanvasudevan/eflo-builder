import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

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
      <Text strong className="text-[10px] block mb-0.5">Message</Text>
      <textarea
        className="w-full min-h-[40px] p-2 border border-[#dfe1e6] rounded text-xs resize-y"
        placeholder="Log message..."
        value={(properties.message as string) || ''}
        onChange={(e) => updateProp('message', e.target.value)}
        rows={2}
      />
    </div>
  );
}
