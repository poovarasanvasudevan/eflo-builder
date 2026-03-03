import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-github';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

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
        <Text strong className="text-[10px] block mb-0.5">JavaScript Code</Text>
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
        <Text className="text-[10px] text-[#706e6b] block mt-1">Use <code>input</code> for upstream data. Set <code>returnValue</code> for the result.</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Timeout (ms)</Text>
        <input
          type="number"
          min={1000}
          max={60000}
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1"
          value={properties.timeoutMs ?? 10000}
          onChange={(e) => updateProp('timeoutMs', e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </div>
    </>
  );
}
