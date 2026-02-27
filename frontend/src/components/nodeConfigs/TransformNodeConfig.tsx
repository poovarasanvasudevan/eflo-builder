import { Input, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;
const { TextArea } = Input;

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
      <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Expression</Text>
      <TextArea
        size="small"
        rows={3}
        style={{ fontFamily: 'monospace', fontSize: 10 }}
        placeholder='body + " transformed"'
        value={properties.expression || ''}
        onChange={(e) => updateProp('expression', e.target.value)}
      />
      <Text type="secondary" style={{ fontSize: 10 }}>
        Uses expr-lang. Available vars from upstream output.
      </Text>
    </div>
  );
}
