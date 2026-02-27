import { Input, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

export const CONDITION_NODE_DOC: NodeDoc = {
  title: 'Decision / Condition',
  description:
    'Evaluates an expression and routes the flow to different branches based on the result. Has two outputs: "Yes" (true) and "No" (false).',
  usage:
    'Write an expression using expr-lang syntax. Variables from upstream node outputs are available. Connect the "Yes" handle for the true path and "No" handle for the false path.',
  properties: [
    { name: 'expression', type: 'expr', desc: 'Boolean expression (e.g. statusCode == 200, amount > 100)', required: true },
  ],
  sampleInput: { statusCode: 200, json: { active: true } },
  sampleOutput: {
    result: true,
    expression: 'statusCode == 200',
    statusCode: 200,
    json: { active: true },
  },
  tips: [
    'Expression syntax: ==, !=, >, <, >=, <=, &&, ||, !',
    'Access nested fields: json.active == true',
    'String comparison: body contains "success"',
    'The "Yes" handle is the left output, "No" is the right output.',
  ],
};

export default function ConditionNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <div>
      <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Expression</Text>
      <TextArea
        size="small"
        rows={2}
        style={{ fontFamily: 'monospace', fontSize: 10 }}
        placeholder="statusCode == 200"
        value={properties.expression || ''}
        onChange={(e) => updateProp('expression', e.target.value)}
      />
      <Text type="secondary" style={{ fontSize: 10 }}>
        Uses expr-lang syntax. Vars come from upstream output.
      </Text>
    </div>
  );
}
