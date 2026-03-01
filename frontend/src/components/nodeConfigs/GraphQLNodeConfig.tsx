import { Input, Typography } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

export const GRAPHQL_NODE_DOC: NodeDoc = {
  title: 'GraphQL',
  description:
    'Calls a GraphQL API with a query and optional variables. Use {{key}} or {{input.key}} in the Variables JSON to substitute values from the previous node.',
  usage:
    'Set the GraphQL endpoint URL and write your query in the editor. In Variables, use valid JSON and replace any value with {{path}} to inject from input (e.g. {{userId}}, {{input.orderId}}).',
  properties: [
    { name: 'url', type: 'string', desc: 'GraphQL endpoint URL (e.g. https://api.example.com/graphql)', required: true },
    { name: 'query', type: 'string', desc: 'GraphQL query or mutation', required: true },
    { name: 'variables', type: 'string', desc: 'JSON object of variables; use {{path}} to substitute from input', required: false },
  ],
  sampleInput: { userId: 42, name: 'Alice' },
  sampleOutput: {
    statusCode: 200,
    data: { user: { id: 42, name: 'Alice' } },
    body: '{"data":{"user":{...}}}',
  },
  tips: [
    'Use {{key}} or {{input.key}} in the Variables JSON to inject values from the previous node.',
    'Variables must be valid JSON; placeholders are replaced before the request (e.g. {"id": {{userId}}}).',
    'The response "data" field is parsed and available as output.data for the next node.',
    'GraphQL errors in the response will cause the node to fail with the error messages.',
  ],
};

export default function GraphQLNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>GraphQL URL</Text>
        <Input
          size="small"
          placeholder="https://api.example.com/graphql"
          value={(properties.url as string) || ''}
          onChange={(e) => updateProp('url', e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: 10 }}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Query</Text>
        <AceEditor
          mode="text"
          theme="github"
          value={(properties.query as string) || ''}
          onChange={(code) => updateProp('query', code)}
          name="graphql-node-query"
          fontSize={10}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{ useWorker: false }}
          style={{ width: '100%', minHeight: 200, borderRadius: 4, border: '1px solid #d9d9d9' }}
          editorProps={{ $blockScrolling: true }}
        />
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Variables (JSON)</Text>
        <AceEditor
          mode="json"
          theme="github"
          value={(properties.variables as string) || '{}'}
          onChange={(code) => updateProp('variables', code)}
          name="graphql-node-variables"
          fontSize={10}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{ useWorker: false }}
          style={{ width: '100%', minHeight: 120, borderRadius: 4, border: '1px solid #d9d9d9' }}
          editorProps={{ $blockScrolling: true }}
        />
        <Text type="secondary" style={{ fontSize: 9, display: 'block', marginTop: 4 }}>
          Use {'{{key}}'} or {'{{input.key}}'} to substitute from the previous node (e.g. {'{{userId}}'}, {'{{input.id}}'}).
        </Text>
      </div>
    </>
  );
}
