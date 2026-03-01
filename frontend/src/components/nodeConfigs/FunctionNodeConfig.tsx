import { InputNumber, Typography } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

export const FUNCTION_NODE_DOC: NodeDoc = {
  title: 'Function',
  description:
    'Runs JavaScript code in a V8 engine and returns the result to the flow. Upstream data is available as the global `input` object; secrets from Config Store are in the global `config` object. Set `returnValue` to pass data to the next node.',
  usage:
    'Write JavaScript in the code editor. Use `input` for data from the previous node and `config` for secrets (e.g. config.token, config["API_KEY"]). Assign to `returnValue` to pass data downstream. If you do not set `returnValue`, the workflow ends at this node.',
  properties: [
    { name: 'code', type: 'string', desc: 'JavaScript code to execute', required: true },
    { name: 'timeoutMs', type: 'number', desc: 'Max execution time in ms (default: 10000)', required: false },
  ],
  sampleInput: { value: 10, name: 'Widget' },
  sampleOutput: {
    value: 10,
    name: 'Widget',
    doubled: 20,
  },
  tips: [
    'Use global `config` for secrets: config.token, config["API_KEY"]. Add keys in Config Store (toolbar).',
    'Set `returnValue` to control what the next node receives. If you do not set it, the flow stops at this node.',
    'Return an object to define the entire output: returnValue = { ...input, doubled: input.value * 2 };',
    'Return a primitive or array and it appears as output.value for the next node.',
    'Return values are JSON-serialized; avoid functions or non-serializable values.',
    'Scripts run in a sandbox (no Node.js APIs); use for data transformation only.',
    'Use the timeout to avoid infinite loops blocking the workflow.',
  ],
};

export default function FunctionNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>JavaScript Code</Text>
        <AceEditor
          mode="javascript"
          theme="github"
          value={properties.code || ''}
          onChange={(code) => updateProp('code', code)}
          name="function-node-code"
          fontSize={10}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          setOptions={{ useWorker: false }}
          style={{ width: '100%', minHeight: 180, borderRadius: 4, border: '1px solid #d9d9d9' }}
          editorProps={{ $blockScrolling: true }}
        />
        <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4 }}>
          Use <code>input</code> for upstream data. Set <code>returnValue</code> for the result.
        </Text>
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Timeout (ms)</Text>
        <InputNumber
          size="small"
          style={{ width: '100%' }}
          min={1000}
          max={60000}
          value={properties.timeoutMs || 10000}
          onChange={(val) => updateProp('timeoutMs', val)}
        />
      </div>
    </>
  );
}
