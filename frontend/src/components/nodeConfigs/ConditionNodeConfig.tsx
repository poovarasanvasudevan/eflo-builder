import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

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
      <Text strong className="text-[10px] block mb-0.5">Expression</Text>
      <textarea
        className="w-full min-h-[40px] p-2 border border-[#dfe1e6] rounded text-[10px] font-mono resize-y"
        placeholder="statusCode == 200"
        value={(properties.expression as string) || ''}
        onChange={(e) => updateProp('expression', e.target.value)}
        rows={2}
      />
      <Text className="text-[10px] text-[#706e6b]">Uses expr-lang syntax. Vars come from upstream output.</Text>
    </div>
  );
}
