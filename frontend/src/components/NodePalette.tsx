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
  CloudServerOutlined,
  ForwardOutlined,
  ApiOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
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
    ],
  },
  {
    title: "Network",
    items: [
      { type: 'http_in', label: 'HTTP In', icon: <GlobalOutlined />, color: '#fff', bg: '#3498db' },
      { type: 'http_out', label: 'HTTP Out', icon: <GlobalOutlined />, color: '#fff', bg: '#2ecc71' },
      { type: 'graphql', label: 'GraphQL', icon: <ApiOutlined />, color: '#fff', bg: '#e535ab' },
    ]
  },
  {
    title: "Files",
    items: [
      { type: 'read_file', label: 'Read File', icon: <FolderOpenOutlined />, color: '#fff', bg: '#2980b9' },
      { type: 'write_file', label: 'Write File', icon: <EditOutlined />, color: '#fff', bg: '#27ae60' },
    ]
  },
  {
    title: "Email",
    items: [
      { type: 'email', label: 'Send Email', icon: <MailOutlined />, color: '#fff', bg: '#8e44ad' },
      { type: 'email_receive', label: 'Receive Email', icon: <InboxOutlined />, color: '#fff', bg: '#6c3483' },
    ]
  },
  {
    title: "Database",
    items: [
      { type: 'database', label: 'Database', icon: <DatabaseOutlined />, color: '#fff', bg: '#2980b9' },
      { type: 'redis', label: 'Redis', icon: <DatabaseOutlined />, color: '#fff', bg: '#d63031' },
    ]
  },
  {
    title: 'Logic',
    items: [
      { type: 'condition', label: 'Decision', icon: <BranchesOutlined />, color: '#fff', bg: '#f49756' },
      { type: 'switch', label: 'Switch', icon: <ApartmentOutlined />, color: '#fff', bg: '#e67e22' },
      { type: 'delay', label: 'Delay', icon: <ClockCircleOutlined />, color: '#fff', bg: '#f4c542' },
      { type: 'transform', label: 'Transform', icon: <ToolOutlined />, color: '#fff', bg: '#f49756' },
      { type: 'function', label: 'Function', icon: <CodeOutlined />, color: '#fff', bg: '#9b59b6' },
    ],
  },
  {
    title: 'Actions',
    items: [
      { type: 'http_request', label: 'HTTP Request', icon: <GlobalOutlined />, color: '#fff', bg: PRIMARY },
      { type: 'log', label: 'Log', icon: <FileTextOutlined />, color: '#fff', bg: '#54b7d3' },
      { type: 'exec', label: 'Exec Command', icon: <CodeOutlined />, color: '#fff', bg: '#2c3e50' },
      { type: 'ssh', label: 'SSH', icon: <CloudServerOutlined />, color: '#fff', bg: '#16a085' },
    ],
  },
  {
    title: 'Config Store',
    items: [
      { type: 'get_config_store', label: 'Get Config Store', icon: <SafetyCertificateOutlined />, color: '#fff', bg: '#16a085' },
      { type: 'set_config_store', label: 'Set Config Store', icon: <SafetyCertificateOutlined />, color: '#fff', bg: '#1abc9c' },
    ],
  },
  {
    title: 'Flow',
    items: [
      { type: 'flow', label: 'Sub-Flow', icon: <PartitionOutlined />, color: '#fff', bg: '#1a5276' },
      { type: 'continue', label: 'Continue', icon: <ForwardOutlined />, color: '#fff', bg: '#16a085' },
      { type: 'end', label: 'End', icon: <StopOutlined />, color: '#fff', bg: '#e8647c' },
    ],
  },
];

export interface TriggerTabCallbacks {
  onOpenScheduleManager?: () => void;
  onOpenRedisSubManager?: () => void;
  onOpenEmailTriggerManager?: () => void;
  onOpenHttpTriggerManager?: () => void;
}

interface NodePaletteProps extends TriggerTabCallbacks {}

const TRIGGER_ITEMS: { key: string; label: string; icon: ReactNode; bg: string; onClickKey: keyof TriggerTabCallbacks }[] = [
  { key: 'cron', label: 'Cron Schedules', icon: <FieldTimeOutlined />, bg: '#2e7d32', onClickKey: 'onOpenScheduleManager' },
  { key: 'redis', label: 'Redis Subscriptions', icon: <NotificationOutlined />, bg: '#c0392b', onClickKey: 'onOpenRedisSubManager' },
  { key: 'email', label: 'Email Triggers', icon: <InboxOutlined />, bg: '#6c3483', onClickKey: 'onOpenEmailTriggerManager' },
  { key: 'http', label: 'HTTP Triggers', icon: <GlobalOutlined />, bg: '#3498db', onClickKey: 'onOpenHttpTriggerManager' },
];

export default function NodePalette({
  onOpenScheduleManager,
  onOpenRedisSubManager,
  onOpenEmailTriggerManager,
  onOpenHttpTriggerManager,
}: NodePaletteProps = {}) {
  const { workflows, currentWorkflow, loadWorkflow, openTabs } = useWorkflowStore();
  const [search, setSearch] = useState('');
  const triggerCallbacks = { onOpenScheduleManager, onOpenRedisSubManager, onOpenEmailTriggerManager, onOpenHttpTriggerManager };

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
            key: 'trigger',
            label: 'Trigger',
            children: (
              <div style={{ paddingBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#706e6b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, padding: '0 2px' }}>
                  Trigger configs
                </div>
                {TRIGGER_ITEMS.map((item) => {
                  const onClick = triggerCallbacks[item.onClickKey];
                  return (
                    <div
                      key={item.key}
                      onClick={() => onClick?.()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        cursor: onClick ? 'pointer' : 'default',
                        borderRadius: 4,
                        transition: 'background 0.15s',
                      }}
                      className='sidebar-item'
                    >
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: item.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 12,
                        flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ),
          },
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
                        // onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f2f2')}
                        // onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        className='sidebar-item'
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
                        
                          transition: 'background 0.15s',
                        }}
                        className='sidebar-item'
                      >
                        <ThunderboltOutlined style={{ fontSize: 12, color: isActive ? PRIMARY : '#706e6b', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 11,
                            fontWeight: isActive ? 600 : 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {wf.name}
                          </div>
                          {wf.description && (
                            <div style={{
                              fontSize: 9,
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
