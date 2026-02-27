import { Input, Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

export const HTTP_REQUEST_NODE_DOC: NodeDoc = {
  title: 'HTTP Request',
  description:
    'Makes an HTTP request to an external URL. Supports GET, POST, PUT, DELETE, and PATCH methods. The response status, headers, and body are passed downstream.',
  usage:
    'Configure the HTTP method and URL. For POST/PUT/PATCH, provide a JSON body. The response is available as output to the next node.',
  properties: [
    { name: 'method', type: 'select', desc: 'HTTP method: GET, POST, PUT, DELETE, PATCH', required: true },
    { name: 'url', type: 'string', desc: 'Full URL to call (e.g. https://api.example.com/data)', required: true },
    { name: 'body', type: 'json', desc: 'Request body (JSON) — for POST, PUT, PATCH', required: false },
  ],
  sampleInput: { userId: 42 },
  sampleOutput: {
    statusCode: 200,
    body: '{"id":42,"name":"John"}',
    json: { id: 42, name: 'John' },
    headers: { 'content-type': 'application/json' },
  },
  tips: [
    'The URL and body can reference data from upstream nodes.',
    'JSON responses are automatically parsed into the "json" output field.',
    'Non-2xx responses will cause the node to fail unless handled by a condition.',
  ],
};

export default function HttpRequestNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Method</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={properties.method || 'GET'}
          onChange={(val) => updateProp('method', val)}
          options={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
            { value: 'PATCH', label: 'PATCH' },
          ]}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>URL</Text>
        <Input
          size="small"
          placeholder="https://api.example.com/data"
          value={properties.url || ''}
          onChange={(e) => updateProp('url', e.target.value)}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Body (JSON)</Text>
        <TextArea
          size="small"
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 10 }}
          placeholder='{"key": "value"}'
          value={properties.body || ''}
          onChange={(e) => updateProp('body', e.target.value)}
        />
      </div>
    </>
  );
}
