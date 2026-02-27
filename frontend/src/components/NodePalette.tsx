import React, { useState, useMemo } from 'react';
import { Tabs, Tag, Input } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  FileTextOutlined,
  ToolOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  NotificationOutlined,
  MailOutlined,
  InboxOutlined,
  ThunderboltOutlined,
  FolderOpenOutlined,
  EditOutlined,
  CodeOutlined,
  ApartmentOutlined,
  SearchOutlined,
  PartitionOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import { PRIMARY } from '../theme';

interface NodeItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const CATEGORIES: { title: string; items: NodeItem[] }[] = [
  {
    title: 'Triggers',
    items: [
      { type: 'start', label: 'Start', icon: <PlayCircleOutlined />, color: '#fff', bg: '#4bc076' },
      { type: 'cron', label: 'Cron', icon: <FieldTimeOutlined />, color: '#fff', bg: '#2e7d32' },
      { type: 'redis_subscribe', label: 'Redis Subscribe', icon: <NotificationOutlined />, color: '#fff', bg: '#c0392b' },
      { type: 'email_receive', label: 'Receive Email', icon: <InboxOutlined />, color: '#fff', bg: '#6c3483' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { type: 'condition', label: 'Decision', icon: <BranchesOutlined />, color: '#fff', bg: '#f49756' },
      { type: 'switch', label: 'Switch', icon: <ApartmentOutlined />, color: '#fff', bg: '#e67e22' },
      { type: 'delay', label: 'Delay', icon: <ClockCircleOutlined />, color: '#fff', bg: '#f4c542' },
      { type: 'transform', label: 'Transform', icon: <ToolOutlined />, color: '#fff', bg: '#f49756' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { type: 'http_request', label: 'HTTP Request', icon: <GlobalOutlined />, color: '#fff', bg: PRIMARY },
      { type: 'log', label: 'Log', icon: <FileTextOutlined />, color: '#fff', bg: '#54b7d3' },
      { type: 'redis', label: 'Redis', icon: <DatabaseOutlined />, color: '#fff', bg: '#d63031' },
      { type: 'email', label: 'Send Email', icon: <MailOutlined />, color: '#fff', bg: '#8e44ad' },
      { type: 'read_file', label: 'Read File', icon: <FolderOpenOutlined />, color: '#fff', bg: '#2980b9' },
      { type: 'write_file', label: 'Write File', icon: <EditOutlined />, color: '#fff', bg: '#27ae60' },
      { type: 'exec', label: 'Exec Command', icon: <CodeOutlined />, color: '#fff', bg: '#2c3e50' },
      { type: 'flow', label: 'Sub-Flow', icon: <PartitionOutlined />, color: '#fff', bg: '#1a5276' },
    ],
  },
  {
    title: 'Flow',
    items: [
      { type: 'end', label: 'End', icon: <StopOutlined />, color: '#fff', bg: '#e8647c' },
    ],
  },
];

export default function NodePalette() {
  const { workflows, currentWorkflow, loadWorkflow, openTabs } = useWorkflowStore();
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [search]);

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <Tabs
        defaultActiveKey="elements"
        size="small"
        style={{ padding: '0 8px' }}
        items={[
          {
            key: 'elements',
            label: 'Elements',
            children: (
              <div style={{ paddingBottom: 8 }}>
                <Input
                  size="small"
                  placeholder="Search nodes..."
                  prefix={<SearchOutlined style={{ color: '#b0b0b0', fontSize: 11 }} />}
                  allowClear
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ marginBottom: 6 }}
                />
                {filteredCategories.length === 0 && (
                  <div style={{ padding: '12px 4px', color: '#706e6b', fontSize: 11, textAlign: 'center' }}>
                    No nodes match "<b>{search}</b>"
                  </div>
                )}
                {filteredCategories.map((cat) => (
                  <div key={cat.title} style={{ marginBottom: 6 }}>
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#706e6b',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      marginBottom: 2,
                      padding: '0 2px',
                    }}>
                      {cat.title}
                    </div>
                    {cat.items.map((item) => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type, item.label)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 6px',
                          cursor: 'grab',
                          borderRadius: 3,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f2f2')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          background: item.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: item.color,
                          fontSize: 13,
                          flexShrink: 0,
                        }}>
                          {item.icon}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 400 }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ),
          },
          {
            key: 'flows',
            label: 'Flows',
            children: (
              <div style={{ paddingBottom: 8 }}>
                {workflows.length === 0 ? (
                  <div style={{ padding: '16px 4px', color: '#706e6b', fontSize: 11, textAlign: 'center' }}>
                    No flows yet. Click <b>+ New</b> to create one.
                  </div>
                ) : (
                  workflows.map((wf) => {
                    const isActive = currentWorkflow?.id === wf.id;
                    return (
                      <div
                        key={wf.id}
                        onClick={() => loadWorkflow(wf.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '5px 6px',
                          cursor: 'pointer',
                          borderRadius: 3,
                          background: isActive ? '#e8f4fd' : 'transparent',
                          borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f3f2f2'; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <ThunderboltOutlined style={{ fontSize: 12, color: isActive ? PRIMARY : '#706e6b', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 11,
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? PRIMARY : '#16325c',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {wf.name}
                          </div>
                          {wf.description && (
                            <div style={{
                              fontSize: 9,
                              color: '#706e6b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: '12px',
                            }}>
                              {wf.description}
                            </div>
                          )}
                        </div>
                        {isActive && <Tag color="blue" style={{ fontSize: 8, lineHeight: '14px', margin: 0, padding: '0 4px' }}>ACTIVE</Tag>}
                        {!isActive && openTabs.some((t) => t.id === wf.id) && <Tag color="default" style={{ fontSize: 8, lineHeight: '14px', margin: 0, padding: '0 4px' }}>OPEN</Tag>}
                      </div>
                    );
                  })
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
