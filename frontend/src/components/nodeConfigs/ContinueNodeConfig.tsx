import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

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
        <Text strong className="text-[10px] block mb-0.5">Run after node</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={(properties.after_node_id as string) ?? ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value || undefined;
            const option = options.find((o) => o.value === val);
            updateProp('after_node_id', val ?? '');
            updateProp('after_node_label', option?.label ?? '');
          }}
        >
          <option value="">Select a node (optional)</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Text className="text-[9px] text-[#706e6b]">This node will run only after the selected node has finished execution.</Text>
      </div>
    </>
  );
}
