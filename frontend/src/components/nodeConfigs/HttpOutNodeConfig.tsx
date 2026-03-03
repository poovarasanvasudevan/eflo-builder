import TextField from '@atlaskit/textfield';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const HTTP_OUT_NODE_DOC: NodeDoc = {
  title: 'HTTP Out',
  description:
    'Sends the HTTP response back to the client that triggered the flow via HTTP-in. Use this node to set status code and body. Input payload/body is sent as the response body (JSON by default).',
  usage:
    'Place after processing nodes. The node sends input.body or input.payload (or the whole input as JSON) as the response. Set statusCode and contentType in node properties or pass them in the input.',
  properties: [
    { name: 'statusCode', type: 'number', desc: 'HTTP status code (default: 200)', required: false },
    { name: 'contentType', type: 'string', desc: 'Content-Type header (default: application/json)', required: false },
  ],
  sampleInput: { result: 'ok', count: 42 },
  sampleOutput: { sent: true, statusCode: 200 },
  tips: [
    'Only works when the flow was triggered by an HTTP-in endpoint.',
    'First HTTP-out node that runs sends the response and ends the request.',
    'Pass statusCode and body (or payload) from previous nodes to control the response.',
  ],
};

export default function HttpOutNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Status code</Text>
        <input
          type="number"
          min={100}
          max={599}
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
          value={(properties.statusCode as number) ?? 200}
          onChange={(e) => updateProp('statusCode', e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Content-Type</Text>
        <TextField
          placeholder="application/json"
          value={(properties.contentType as string) ?? ''}
          onChange={(e) => updateProp('contentType', e.currentTarget.value)}
        />
      </div>
      <div>
        <Text className="text-[9px] text-[#706e6b]">Response body comes from input.body or input.payload. Set these in upstream nodes.</Text>
      </div>
    </>
  );
}
