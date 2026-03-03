import { useState, useEffect } from 'react';
import TextField from '@atlaskit/textfield';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

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
        <Text strong className="text-[10px] block mb-0.5">Method</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={(properties.method as string) || 'GET'}
          onChange={(e) => updateProp('method', e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">URL</Text>
        <TextField
          placeholder="https://api.example.com/data"
          value={(properties.url as string) || ''}
          onChange={(e) => updateProp('url', e.currentTarget.value)}
        />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Headers (JSON)</Text>
        <textarea
          className="w-full min-h-[60px] p-2 border rounded text-[10px] font-mono resize-y"
          style={{ borderColor: headersError ? '#de350b' : '#dfe1e6' }}
          placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
          value={headersText}
          onChange={(e) => applyHeaders(e.target.value)}
          rows={3}
        />
        {headersError && <Text className="text-[9px] text-red-600">{headersError}</Text>}
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Body (JSON)</Text>
        <textarea
          className="w-full min-h-[60px] p-2 border border-[#dfe1e6] rounded text-[10px] font-mono resize-y"
          placeholder='{"key": "value"}'
          value={(properties.body as string) || ''}
          onChange={(e) => updateProp('body', e.target.value)}
          rows={3}
        />
      </div>
    </>
  );
}
