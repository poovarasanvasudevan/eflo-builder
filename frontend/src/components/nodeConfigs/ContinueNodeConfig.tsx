import { Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

export const CONTINUE_NODE_DOC: NodeDoc = {
  title: 'Continue',
  description:
    'Runs only after a specific node has finished execution. Like Node-RED\'s continue node: use it when this branch should run only once the configured node has completed (e.g. after a delay or sub-flow).',
  usage:
    'Select the node that must finish before this Continue node runs. Connect the output of that node (or any upstream data) into this node. Downstream nodes run only after the selected node has executed.',
  properties: [
    { name: 'after_node_id', type: 'string', desc: 'ID of the node that must complete before this node runs', required: false },
    { name: 'after_node_label', type: 'string', desc: 'Label of the selected node (auto-populated)', required: false },
  ],
  sampleInput: { delayed: true, payload: 'from delay node' },
  sampleOutput: {
    continued: true,
    delayed: true,
    payload: 'from delay node',
  },
  tips: [
    'Use after a Delay so the rest of the flow runs only when the delay finishes.',
    'Use after a Sub-Flow so the parent flow continues only when the sub-flow completes.',
    'If "After node" is empty, the node runs as soon as it is reached by the engine (normal BFS).',
    'Connect an edge from the node you wait for into Continue so its output is passed downstream.',
  ],
};

export default function ContinueNodeConfig({
  nodeId,
  properties,
  updateProp,
  workflowNodes = [],
}: NodeConfigProps) {
  const options = workflowNodes
    .filter((n) => n.id !== nodeId)
    .map((n) => ({
      value: n.id,
      label: n.label ? `${n.label} (${n.id})` : n.id,
    }));

  return (
    <>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>
          Run after node
        </Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select a node (optional)"
          value={properties.after_node_id ?? undefined}
          onChange={(val) => {
            const option = options.find((o) => o.value === val);
            updateProp('after_node_id', val ?? '');
            updateProp('after_node_label', option?.label ?? '');
          }}
          options={options}
          showSearch
          optionFilterProp="label"
          allowClear
          onClear={() => {
            updateProp('after_node_id', undefined);
            updateProp('after_node_label', undefined);
          }}
        />
        <Text type="secondary" style={{ fontSize: 9 }}>
          This node will run only after the selected node has finished execution.
        </Text>
      </div>
    </>
  );
}
