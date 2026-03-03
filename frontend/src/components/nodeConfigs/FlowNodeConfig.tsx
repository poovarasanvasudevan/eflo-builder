import type { NodeConfigProps, NodeDoc } from './types';
import { Text } from '../ui/Text';

export const FLOW_NODE_DOC: NodeDoc = {
  title: 'Sub-Flow',
  description:
    'Executes another workflow as a sub-flow. This allows you to compose complex automations by chaining workflows together. The target workflow runs to completion before the parent flow continues.',
  usage:
    "Select a target workflow from the dropdown. Optionally enable \"Pass Input\" to forward upstream data into the sub-flow's start node. The sub-flow execution result (ID, status, duration) is returned as output. Connect the output to downstream nodes to continue after the sub-flow completes.",
  properties: [
    { name: 'workflow_id', type: 'number', desc: 'ID of the workflow to execute as a sub-flow', required: true },
    { name: 'workflow_name', type: 'string', desc: 'Name of the selected workflow (auto-populated)', required: false },
    { name: 'pass_input', type: 'boolean', desc: 'If true, forward all upstream data as input to the sub-flow', required: false },
  ],
  sampleInput: { userId: 42, action: 'process' },
  sampleOutput: {
    subflow_execution_id: 15,
    subflow_workflow_id: 3,
    subflow_name: 'Data Processing',
    subflow_status: 'completed',
    subflow_duration_ms: 1250,
    userId: 42,
    action: 'process',
  },
  tips: [
    'The current workflow is excluded from the dropdown to prevent infinite recursion.',
    'Sub-flows run synchronously — the parent flow waits until the sub-flow finishes.',
    'If the sub-flow fails, the Flow node will also fail and log the sub-flow error.',
    'Use "Pass Input" to share data between parent and sub-flows.',
    'The sub-flow creates its own execution entry — you can view it separately in Execution History.',
    'Chain multiple Flow nodes to create complex multi-stage pipelines.',
    '⚠️ Avoid circular references (Flow A → Flow B → Flow A) as this will cause infinite execution.',
  ],
};

export default function FlowNodeConfig({
  properties,
  updateProp,
  workflows = [],
  currentWorkflowId,
}: NodeConfigProps) {
  const options = workflows
    .filter((wf) => wf.id !== currentWorkflowId)
    .map((wf) => ({ value: wf.id, label: `#${wf.id} — ${wf.name}` }));
  return (
    <>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Target Workflow</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.workflow_id != null ? String(properties.workflow_id) : ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value === '' ? undefined : Number(e.target.value);
            const wf = workflows.find((w) => w.id === val);
            updateProp('workflow_id', val);
            if (wf) updateProp('workflow_name', wf.name);
          }}
        >
          <option value="">Select a workflow to run</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Text className="text-[9px] text-[#706e6b]">The selected workflow will be executed as a sub-flow. Current workflow is excluded.</Text>
      </div>
      <div>
        <Text strong className="text-[10px] block mb-0.5">Pass Input to Sub-Flow</Text>
        <select
          className="w-full text-xs border border-[#dfe1e6] rounded px-2 py-1 bg-white"
          value={properties.pass_input ? 'yes' : 'no'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateProp('pass_input', e.target.value === 'yes')}
        >
          <option value="yes">Yes — forward all input data</option>
          <option value="no">No — start sub-flow with empty input</option>
        </select>
        <Text className="text-[9px] text-[#706e6b]">When enabled, all data from upstream nodes is passed as input to the sub-flow's start node.</Text>
      </div>
    </>
  );
}
