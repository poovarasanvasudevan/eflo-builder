import { useEffect } from 'react';
import { Input, Typography, Divider, Space, Tag, Tabs } from 'antd';
import { useWorkflowStore } from '../store/workflowStore';
import { getNodeConfigComponent, NODE_DOCS } from './nodeConfigs';
import { PRIMARY } from '../theme';

const { Text } = Typography;

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
  }, []);

  if (!selectedNode) {
    return (
      <div style={{ padding: 8 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>Select a node to edit its properties</Text>
      </div>
    );
  }

  const data = selectedNode.data as any;
  const properties = data.properties || {};
  const nodeType = selectedNode.type || '';

  const updateProp = (key: string, value: any) => {
    updateNodeData(selectedNode.id, {
      properties: { ...properties, [key]: value },
    });
  };

  const updateLabel = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  return (
    <div style={{ fontSize: 10 }}>
      <Tabs
        defaultActiveKey="props"
        size="small"
        style={{ padding: '0 8px' }}
        items={[
          {
            key: 'props',
            label: 'Properties',
            children: (
              <div style={{ paddingBottom: 8 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <div>
          <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 1 }}>Label</Text>
          <Input
            size="small"
            value={data.label || ''}
            onChange={(e) => updateLabel(e.target.value)}
          />
        </div>

        <div>
          <Tag color="blue" style={{ fontSize: 9 }}>{nodeType}</Tag>
          <Text type="secondary" style={{ fontSize: 9 }}>{selectedNode.id}</Text>
        </div>

        <Divider style={{ margin: '2px 0' }} />
        {(() => {
          const NodeConfig = getNodeConfigComponent(nodeType);
          if (!NodeConfig) return null;
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
            />
          );
        })()}
      </Space>
              </div>
            ),
          },
          {
            key: 'docs',
            label: 'Documentation',
            children: <NodeDocumentation nodeType={nodeType} />,
          },
        ]}
      />
    </div>
  );
}

/* ── Documentation Tab Component ── */

function NodeDocumentation({ nodeType }: { nodeType: string }) {
  const doc = NODE_DOCS[nodeType];

  if (!doc) {
    return (
      <div style={{ padding: '12px 4px', color: '#706e6b', fontSize: 11 }}>
        No documentation available for this node type.
      </div>
    );
  }

  const codeBlockStyle: React.CSSProperties = {
    background: '#f5f5f5',
    border: '1px solid #e8e8e8',
    borderRadius: 4,
    padding: '6px 8px',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: 10,
    lineHeight: '15px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    overflowX: 'auto',
    color: '#1e1e1e',
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#16325c',
    marginBottom: 3,
    display: 'block',
  };

  return (
    <div style={{ paddingBottom: 12 }}>
      {/* Title & Description */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#16325c', marginBottom: 4 }}>{doc.title}</div>
        <div style={{ fontSize: 11, color: '#444', lineHeight: '16px' }}>{doc.description}</div>
      </div>

      {/* How to Use */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>📖 How to Use</span>
        <div style={{ fontSize: 10, color: '#555', lineHeight: '15px' }}>{doc.usage}</div>
      </div>

      {/* Properties Table */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>⚙ Properties</span>
        <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e8e8', textAlign: 'left' }}>
              <th style={{ padding: '3px 4px', color: '#706e6b', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '3px 4px', color: '#706e6b', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '3px 4px', color: '#706e6b', fontWeight: 600 }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {doc.properties.map((p) => (
              <tr key={p.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '3px 4px', fontFamily: 'monospace', color: PRIMARY }}>
                  {p.name}{p.required && <span style={{ color: '#e8647c' }}>*</span>}
                </td>
                <td style={{ padding: '3px 4px', color: '#706e6b' }}>{p.type}</td>
                <td style={{ padding: '3px 4px', color: '#444' }}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sample Input */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>📥 Sample Input</span>
        <div style={codeBlockStyle}>{JSON.stringify(doc.sampleInput, null, 2)}</div>
      </div>

      {/* Sample Output */}
      <div style={{ marginBottom: 10 }}>
        <span style={sectionTitle}>📤 Sample Output</span>
        <div style={codeBlockStyle}>{JSON.stringify(doc.sampleOutput, null, 2)}</div>
      </div>

      {/* Tips */}
      {doc.tips && doc.tips.length > 0 && (
        <div>
          <span style={sectionTitle}>💡 Tips</span>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: '#555', lineHeight: '16px' }}>
            {doc.tips.map((tip, i) => (
              <li key={i} style={{ marginBottom: 2 }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
