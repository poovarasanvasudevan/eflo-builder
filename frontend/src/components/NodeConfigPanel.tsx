import { useEffect, useState } from 'react';
import Tabs, { TabList, Tab, TabPanel } from '@atlaskit/tabs';
import TextField from '@atlaskit/textfield';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import { getNodeConfigComponent, NODE_DOCS } from './nodeConfigs';
import { PRIMARY } from '../theme';
import { Text } from './ui/Text';

export default function NodeConfigPanel() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const configs = useWorkflowStore((s) => s.configs);
  const fetchConfigs = useWorkflowStore((s) => s.fetchConfigs);
  const workflows = useWorkflowStore((s) => s.workflows);
  const currentWorkflow = useWorkflowStore((s) => s.currentWorkflow);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  if (!selectedNode) {
    return (
      <div className="p-2">
        <Text className="text-[#706e6b] text-[11px]">Select a node to edit its properties</Text>
      </div>
    );
  }

  const data = selectedNode.data as Record<string, unknown>;
  const properties = (data?.properties as Record<string, unknown>) || {};
  const nodeType = (selectedNode.type as string) || '';

  const updateProp = (key: string, value: unknown) => {
    updateNodeData(selectedNode.id, {
      properties: { ...properties, [key]: value },
    });
  };

  const updateLabel = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  const [tabIndex, setTabIndex] = useState(0);
  return (
    <div className="text-[10px] px-2">
      <Tabs id="node-config-tabs" selected={tabIndex} onChange={(idx: number) => setTabIndex(idx)}>
        <TabList>
          <Tab>Properties</Tab>
          <Tab>Documentation</Tab>
        </TabList>
        <TabPanel>
          <div className="flex flex-col gap-1 pb-2">
            <div>
              <Text strong className="block mb-0.5 text-[10px]">Label</Text>
              <TextField value={(data?.label as string) || ''} onChange={(e) => updateLabel(e.currentTarget.value)} />
            </div>
            <div className="flex items-center gap-1.5">
              <Lozenge appearance="inprogress">{nodeType}</Lozenge>
              <Text className="text-[9px] text-[#706e6b]">{selectedNode.id}</Text>
            </div>
            <div className="border-t border-[#e8e8e8] my-0.5" />
            {(() => {
              const NodeConfig = getNodeConfigComponent(nodeType);
              if (!NodeConfig) return null;
              const workflowNodes = (nodes ?? []).map((n) => ({
                id: n.id,
                type: n.type ?? undefined,
                label: (n.data as { label?: string })?.label ?? undefined,
              }));
              return (
                <NodeConfig
                  nodeId={selectedNode.id}
                  nodeType={nodeType}
                  properties={properties}
                  updateProp={updateProp}
                  updateLabel={updateLabel}
                  configs={configs}
                  workflows={workflows ?? []}
                  currentWorkflowId={currentWorkflow?.id ?? null}
                  workflowNodes={workflowNodes}
                />
              );
            })()}
          </div>
        </TabPanel>
        <TabPanel>
          <NodeDocumentation nodeType={nodeType} />
        </TabPanel>
      </Tabs>
    </div>
  );
}

function NodeDocumentation({ nodeType }: { nodeType: string }) {
  const doc = NODE_DOCS[nodeType];

  if (!doc) {
    return (
      <div className="py-3 px-1 text-[#706e6b] text-[11px]">
        No documentation available for this node type.
      </div>
    );
  }

  return (
    <div className="pb-3">
      <div className="mb-2.5">
        <div className="text-[13px] font-bold text-[#16325c] mb-1">{doc.title}</div>
        <div className="text-[11px] text-[#444] leading-4">{doc.description}</div>
      </div>
      <div className="mb-2.5">
        <span className="text-[11px] font-bold text-[#16325c] block mb-0.5">📖 How to Use</span>
        <div className="text-[10px] text-[#555] leading-[15px]">{doc.usage}</div>
      </div>
      <div className="mb-2.5">
        <span className="text-[11px] font-bold text-[#16325c] block mb-0.5">⚙ Properties</span>
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="border-b border-[#e8e8e8] text-left">
              <th className="py-0.5 px-1 text-[#706e6b] font-semibold">Name</th>
              <th className="py-0.5 px-1 text-[#706e6b] font-semibold">Type</th>
              <th className="py-0.5 px-1 text-[#706e6b] font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {doc.properties.map((p) => (
              <tr key={p.name} className="border-b border-[#f0f0f0]">
                <td className="py-0.5 px-1 font-mono text-[10px]" style={{ color: PRIMARY }}>
                  {p.name}{p.required && <span className="text-red-500">*</span>}
                </td>
                <td className="py-0.5 px-1 text-[#706e6b]">{p.type}</td>
                <td className="py-0.5 px-1 text-[#444]">{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-2.5">
        <span className="text-[11px] font-bold text-[#16325c] block mb-0.5">📥 Sample Input</span>
        <pre className="bg-[#f5f5f5] border border-[#e8e8e8] rounded p-1.5 font-mono text-[10px] leading-[15px] whitespace-pre-wrap break-all overflow-x-auto text-[#1e1e1e]">
          {JSON.stringify(doc.sampleInput, null, 2)}
        </pre>
      </div>
      <div className="mb-2.5">
        <span className="text-[11px] font-bold text-[#16325c] block mb-0.5">📤 Sample Output</span>
        <pre className="bg-[#f5f5f5] border border-[#e8e8e8] rounded p-1.5 font-mono text-[10px] leading-[15px] whitespace-pre-wrap break-all overflow-x-auto text-[#1e1e1e]">
          {JSON.stringify(doc.sampleOutput, null, 2)}
        </pre>
      </div>
      {doc.tips && doc.tips.length > 0 && (
        <div>
          <span className="text-[11px] font-bold text-[#16325c] block mb-0.5">💡 Tips</span>
          <ul className="m-0 pl-4 text-[10px] text-[#555] leading-4">
            {doc.tips.map((tip, i) => (
              <li key={i} className="mb-0.5">{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
