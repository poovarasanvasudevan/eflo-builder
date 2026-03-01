import { useState, useEffect } from 'react';
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
    { name: 'headers', type: 'json', desc: 'Optional request headers as JSON object (e.g. {"Authorization": "Bearer token"})', required: false },
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
    'Use {{config.key}} for secrets in URL, body, or headers (e.g. {{config.API_TOKEN}}). Keys come from Config Store.',
    'Use {{input.xxx}} for values from the previous node (e.g. {{input.userId}}).',
    'Use Headers (JSON) to set Authorization, Content-Type, or custom headers (e.g. {"Authorization": "Bearer {{config.API_TOKEN}}"}).',
    'JSON responses are automatically parsed into the "json" output field.',
    'Non-2xx responses will cause the node to fail unless handled by a condition.',
  ],
};

function headersToValue(properties: Record<string, unknown>): string {
  const h = properties.headers;
  if (h == null) return '{}';
  if (typeof h === 'string') return h.trim() || '{}';
  try {
    return JSON.stringify(h, null, 2);
  } catch {
    return '{}';
  }
}

export default function HttpRequestNodeConfig({ properties, updateProp }: NodeConfigProps) {
  const [headersText, setHeadersText] = useState(headersToValue(properties));
  const [headersError, setHeadersError] = useState<string | null>(null);

  useEffect(() => {
    setHeadersText(headersToValue(properties));
  }, [properties.headers]);

  const applyHeaders = (raw: string) => {
    setHeadersText(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      updateProp('headers', {});
      setHeadersError(null);
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        updateProp('headers', parsed);
        setHeadersError(null);
      } else {
        setHeadersError('Headers must be a JSON object');
      }
    } catch {
      setHeadersError('Invalid JSON');
    }
  };

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Headers (JSON)</Text>
        <TextArea
          size="small"
          rows={3}
          style={{ fontFamily: 'monospace', fontSize: 10 }}
          placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
          value={headersText}
          onChange={(e) => applyHeaders(e.target.value)}
          status={headersError ? 'error' : undefined}
        />
        {headersError && (
          <Text type="danger" style={{ fontSize: 9 }}>{headersError}</Text>
        )}
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
