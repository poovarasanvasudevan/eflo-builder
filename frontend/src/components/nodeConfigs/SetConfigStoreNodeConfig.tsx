import { Input, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Key</Text>
        <Input
          size="small"
          placeholder="e.g. CACHED_TOKEN"
          value={(properties.key as string) || ''}
          onChange={(e) => updateProp('key', e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Value (optional)</Text>
        <TextArea
          size="small"
          rows={2}
          placeholder="Leave empty to use input.value from previous node"
          value={(properties.value as string) || ''}
          onChange={(e) => updateProp('value', e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 10 }}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Description (optional)</Text>
        <Input
          size="small"
          placeholder="e.g. Token from auth flow"
          value={(properties.description as string) || ''}
          onChange={(e) => updateProp('description', e.target.value)}
        />
      </div>
    </>
  );
}
