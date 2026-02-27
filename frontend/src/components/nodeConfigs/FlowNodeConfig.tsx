import { Select, Typography } from 'antd';
import type { NodeConfigProps, NodeDoc } from './types';

const { Text } = Typography;

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
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Target Workflow</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          placeholder="Select a workflow to run"
          value={properties.workflow_id ?? undefined}
          onChange={(val) => {
            const wf = workflows.find((w) => w.id === val);
            updateProp('workflow_id', val);
            if (wf) updateProp('workflow_name', wf.name);
          }}
          options={options}
          showSearch
          optionFilterProp="label"
          allowClear
          onClear={() => {
            updateProp('workflow_id', undefined);
            updateProp('workflow_name', undefined);
          }}
        />
        <Text type="secondary" style={{ fontSize: 9 }}>
          The selected workflow will be executed as a sub-flow. Current workflow is excluded.
        </Text>
      </div>
      <div>
        <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Pass Input to Sub-Flow</Text>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={properties.pass_input ? 'yes' : 'no'}
          onChange={(val) => updateProp('pass_input', val === 'yes')}
          options={[
            { value: 'yes', label: 'Yes — forward all input data' },
            { value: 'no', label: 'No — start sub-flow with empty input' },
          ]}
        />
        <Text type="secondary" style={{ fontSize: 9 }}>
          When enabled, all data from upstream nodes is passed as input to the sub-flow's start node.
        </Text>
      </div>
    </>
  );
}
