import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const TRANSFORM_NODE_DOC: NodeDoc = {
  title: 'Transform',
  description:
    'Transforms data using an expr-lang expression. The expression result becomes the primary output, along with all input data.',
  usage:
    'Write an expression to compute a new value. Upstream data is available as variables. The result is stored in the "result" output field.',
  properties: [
    { name: 'expression', type: 'expr', desc: 'Expression to evaluate (e.g. json.price * 1.1)', required: true },
  ],
  sampleInput: { json: { price: 100, name: 'Widget' } },
  sampleOutput: {
    result: 110,
    expression: 'json.price * 1.1',
    json: { price: 100, name: 'Widget' },
  },
  tips: [
    'Use to reshape data between nodes.',
    'String concat: name + " - processed"',
    'Math: price * quantity',
    'Conditional: status == "active" ? "yes" : "no"',
  ],
};

export default function TransformNodeConfig({ properties, updateProp }: NodeConfigProps) {
  return (
    <div>
      <Text strong className="text-[10px] block mb-0.5">Expression</Text>
      <textarea
        className="w-full min-h-[60px] p-2 border border-[#dfe1e6] rounded text-[10px] font-mono resize-y"
        placeholder='body + " transformed"'
        value={(properties.expression as string) || ''}
        onChange={(e) => updateProp('expression', e.target.value)}
        rows={3}
      />
      <Text className="text-[10px] text-[#706e6b]">Uses expr-lang. Available vars from upstream output.</Text>
    </div>
  );
}
