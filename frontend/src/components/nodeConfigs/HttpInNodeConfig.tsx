import { Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

export const HTTP_IN_NODE_DOC: NodeDoc = {
  title: 'HTTP In',
  description:
    'Trigger node for HTTP-in flows (like Node-RED). When a request hits the path registered in HTTP Triggers, the workflow runs with the request data as input. This node passes through payload, headers, query, method, and path.',
  usage:
    'Add an HTTP Trigger in the toolbar (HTTP Triggers). Set workflow, path (e.g. webhook), and method. Use HTTP-out node in the flow to send the response. Request body (JSON) is in input.payload and input.body; headers in input.headers; query in input.query.',
  properties: [],
  sampleInput: {
    method: 'POST',
    path: 'webhook',
    payload: { name: 'test' },
    headers: { 'content-type': 'application/json' },
    query: {},
  },
  sampleOutput: {
    method: 'POST',
    path: 'webhook',
    payload: { name: 'test' },
    body: { name: 'test' },
    headers: {},
    query: {},
    triggered: true,
    triggeredAt: '2025-02-27T12:00:00Z',
  },
  tips: [
    'Register the endpoint in ⚙ HTTP Triggers (toolbar).',
    'Request body is available as payload and body; use HTTP-out to respond.',
    'Use one HTTP-out node in the flow to send the response back to the client.',
  ],
};

export default function HttpInNodeConfig(_props: NodeConfigProps) {
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 10 }}>
        Request data (payload, headers, query) is passed from the HTTP trigger. Add an HTTP-out node to send the response.
      </Text>
    </div>
  );
}
