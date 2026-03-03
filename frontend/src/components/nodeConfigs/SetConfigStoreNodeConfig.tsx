import TextField from '@atlaskit/textfield';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const SET_CONFIG_STORE_NODE_DOC: NodeDoc = {
  title: 'Set Config Store',
  description:
    'Writes a key-value pair to the Config Store. Values can be used later by Get Config Store or for secrets/tokens.',
  usage:
    'Set the key and optionally a static value. If value is left empty, input.value from the previous node is used.',
  properties: [
    { name: 'key', type: 'string', desc: 'Config store key', required: true },
    { name: 'value', type: 'string', desc: 'Value to store (optional; use input.value from upstream if empty)', required: false },
    { name: 'description', type: 'string', desc: 'Optional description for the entry', required: false },
  ],
  sampleInput: { value: 'token-from-upstream' },
  sampleOutput: { _config_store_key: 'MY_TOKEN', _config_store_set: true, value: 'token-from-upstream' },
  tips: [
    'Leave value empty to use the value from the previous node (e.g. input.value).',
    'You can view and manage all entries in Config Store from the toolbar.',
  ],
};

export default function SetConfigStoreNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Key</Text>
        <TextField
          placeholder="e.g. CACHED_TOKEN"
          value={(properties.key as string) || ''}
          onChange={(e) => updateProp('key', e.currentTarget.value)}
          className="font-mono"
        />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Value (optional)</Text>
        <textarea
          className="w-full min-h-[40px] p-2 border border-[#dfe1e6] rounded text-[10px] font-mono resize-y"
          placeholder="Leave empty to use input.value from previous node"
          value={(properties.value as string) || ''}
          onChange={(e) => updateProp('value', e.target.value)}
          rows={2}
        />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Description (optional)</Text>
        <TextField
          placeholder="e.g. Token from auth flow"
          value={(properties.description as string) || ''}
          onChange={(e) => updateProp('description', e.currentTarget.value)}
        />
      </div>
    </>
  );
}
