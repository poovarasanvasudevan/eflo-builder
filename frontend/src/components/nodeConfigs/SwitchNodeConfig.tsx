import { Input, Button, Divider, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Expression</Text>
        <Input
          size="small"
          placeholder="statusCode or json.type"
          value={properties.expression || ''}
          onChange={(e) => updateProp('expression', e.target.value)}
        />
        <Text type="secondary" style={{ fontSize: 9 }}>
          Evaluated against input. Result is matched to cases.
        </Text>
      </div>
      <Divider style={{ margin: '4px 0', fontSize: 9 }}>Cases</Divider>
      {cases.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Input
            size="small"
            placeholder="Label"
            style={{ width: '45%' }}
            value={c.label || ''}
            onChange={(e) => {
              const next = [...cases];
              next[i] = { ...next[i], label: e.target.value };
              updateProp('cases', next);
            }}
          />
          <Input
            size="small"
            placeholder="Value"
            style={{ width: '45%' }}
            value={c.value || ''}
            onChange={(e) => {
              const next = [...cases];
              next[i] = { ...next[i], value: e.target.value };
              updateProp('cases', next);
            }}
          />
          <span
            style={{ cursor: 'pointer', color: '#e8647c', fontSize: 12, fontWeight: 700 }}
            onClick={() => {
              const next = [...cases];
              next.splice(i, 1);
              updateProp('cases', next);
            }}
          >✕</span>
        </div>
      ))}
      <Button
        size="small"
        type="dashed"
        style={{ width: '100%', fontSize: 10 }}
        onClick={() => updateProp('cases', [...cases, { label: '', value: '' }])}
      >+ Add Case</Button>
      <Text type="secondary" style={{ fontSize: 9 }}>
        Non-matching values route to the "Default" handle.
      </Text>
    </>
  );
}
