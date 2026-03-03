import TextField from '@atlaskit/textfield';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const GET_CONFIG_STORE_NODE_DOC: NodeDoc = {
  title: 'Get Config Store',
  description:
    'Reads a value from the Config Store by key. Use the Config Store (toolbar) to add keys like API_SECRET, AUTH_TOKEN, etc.',
  usage: 'Enter the key to look up. The value is output as output.value (and output.key).',
  properties: [
    { name: 'key', type: 'string', desc: 'Config store key (e.g. API_SECRET, AUTH_TOKEN)', required: true },
  ],
  sampleInput: {},
  sampleOutput: { key: 'API_SECRET', value: 'sk-xxx...' },
  tips: [
    'Add keys in the Config Store from the toolbar (shield icon).',
    'Use the output value in downstream nodes (e.g. in HTTP Request headers).',
  ],
};

export default function GetConfigStoreNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <div>
      <Text strong className="text-[10px] block mb-0.5">Key</Text>
      <TextField
        placeholder="e.g. API_SECRET, AUTH_TOKEN"
        value={(properties.key as string) || ''}
        onChange={(e) => updateProp('key', e.currentTarget.value)}
        className="font-mono"
      />
    </div>
  );
}
