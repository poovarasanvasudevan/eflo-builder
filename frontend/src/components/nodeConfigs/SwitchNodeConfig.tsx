import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const SWITCH_NODE_DOC: NodeDoc = {
  title: 'Switch (Multi-Decision)',
  description:
    'Evaluates an expression and routes the flow to one of multiple branches based on the result. Like a switch/case statement. If no case matches, routes to the "Default" branch.',
  usage:
    'Set an expression to evaluate (e.g. "statusCode" or "json.type"). Add cases with a label and value. Each case becomes a source handle. Connect edges from each handle to the appropriate downstream node. Non-matching results go to "Default".',
  properties: [
    { name: 'expression', type: 'expr', desc: 'Expression to evaluate — result is matched against case values', required: true },
    { name: 'cases', type: 'array', desc: 'Array of {label, value} objects defining each branch', required: true },
  ],
  sampleInput: { statusCode: 200, json: { type: 'order', status: 'pending' } },
  sampleOutput: {
    _branch: 'success',
    result: 200,
    resultStr: '200',
    expression: 'statusCode',
    matched: true,
    statusCode: 200,
    json: { type: 'order', status: 'pending' },
  },
  tips: [
    'Each case needs a "label" (used as the handle ID for edge connections) and a "value" (matched against the expression result).',
    'The expression result is converted to a string for matching.',
    'Add as many cases as needed — each appears as a separate output handle on the node.',
    'The "Default" handle is always present for unmatched values.',
    'Example: expression="json.status", cases: [{label:"pending", value:"pending"}, {label:"shipped", value:"shipped"}]',
    'Works like a switch/case in programming — only the first matching case is followed.',
  ],
};

export default function SwitchNodeConfig({ properties, updateProp }: NodeConfigProps) {
  const cases = (properties.cases as Array<{ label?: string; value?: string }>) || [];
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Expression</Text>
        <TextField placeholder="statusCode or json.type" value={(properties.expression as string) || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateProp('expression', e.target.value)} />
        <Text className="text-[9px] text-[#706e6b]">Evaluated against input. Result is matched to cases.</Text>
      </div>
      <div className="border-t border-[#e8e8e8] my-1 py-1 text-[9px] text-[#706e6b]">Cases</div>
      {cases.map((c, i) => (
        <div key={i} className="flex gap-1 items-center">
          <input className="w-[45%] text-xs border border-[#dfe1e6] rounded px-2 py-1" placeholder="Label" value={c.label || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const next = [...cases]; next[i] = { ...next[i], label: e.target.value }; updateProp('cases', next); }} />
          <input className="w-[45%] text-xs border border-[#dfe1e6] rounded px-2 py-1" placeholder="Value" value={c.value || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const next = [...cases]; next[i] = { ...next[i], value: e.target.value }; updateProp('cases', next); }} />
          <button type="button" className="cursor-pointer text-red-500 text-xs font-bold leading-none p-0.5" onClick={() => { const next = [...cases]; next.splice(i, 1); updateProp('cases', next); }}>✕</button>
        </div>
      ))}
      <Button appearance="subtle" onClick={() => updateProp('cases', [...cases, { label: '', value: '' }])} className="!text-[10px] w-full">+ Add Case</Button>
      <Text className="text-[9px] text-[#706e6b]">Non-matching values route to the &quot;Default&quot; handle.</Text>
    </>
  );
}
