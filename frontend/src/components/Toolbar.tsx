import { useRef, useState } from 'react';
import { Button, Select, Modal, Input, Space, Tooltip, Tag, message } from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SettingOutlined,
  UndoOutlined,
  RedoOutlined,
  ScissorOutlined,
  CopyOutlined,
  DeleteColumnOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  BugOutlined,
  FileImageFilled,
  BulbOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import { exportWorkflow } from '../api/client';
import { PRIMARY } from '../theme';
import ConfigManager from './ConfigManager';
import ConfigStoreManager from './ConfigStoreManager';
import ScheduleManager from './ScheduleManager';
import RedisSubscriptionManager from './RedisSubscriptionManager';
import EmailTriggerManager from './EmailTriggerManager';
import HttpTriggerManager from './HttpTriggerManager';
import {getNodesBounds, getViewportForBounds, useReactFlow} from "@xyflow/react";
import {toPng} from "html-to-image";

const { TextArea } = Input;

interface ToolbarProps {
  toolboxOpen: boolean;
  onToggleToolbox: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  showScheduleManager: boolean;
  setShowScheduleManager: (v: boolean) => void;
  showRedisSubManager: boolean;
  setShowRedisSubManager: (v: boolean) => void;
  showEmailTriggerManager: boolean;
  setShowEmailTriggerManager: (v: boolean) => void;
  showHttpTriggerManager: boolean;
  setShowHttpTriggerManager: (v: boolean) => void;
  showConfigStoreManager: boolean;
  setShowConfigStoreManager: (v: boolean) => void;
}

export default function Toolbar({
  toolboxOpen,
  onToggleToolbox,
  darkMode,
  toggleDarkMode,
  showScheduleManager,
  setShowScheduleManager,
  showRedisSubManager,
  setShowRedisSubManager,
  showEmailTriggerManager,
  setShowEmailTriggerManager,
  showHttpTriggerManager,
  setShowHttpTriggerManager,
  showConfigStoreManager,
  setShowConfigStoreManager,
}: ToolbarProps) {
  const {
    currentWorkflow,
    workflows,
    saveWorkflow,
    runWorkflow,
    loadWorkflow,
    createNewWorkflow,
    removeWorkflow,
    fetchWorkflows,
    importFlow,
    setShowExecutionPanel,
    setExecutionPanelTab,
    setDebugRunTrigger,
    showExecutionPanel,
    openTabs,
    activeTabId,
    switchTab,
    closeTab,
  } = useWorkflowStore();


  const { getNodes } = useReactFlow()

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [messageApi, contextHolder] = message.useMessage();
  const [showConfigManager, setShowConfigManager] = useState(false);

  const handleSave = async () => {
    if (!currentWorkflow) return;
    try {
      await saveWorkflow();
      messageApi.success('Workflow saved!');
    } catch {
      messageApi.error('Failed to save workflow');
    }
  };

  const handleDownload = async () => {
    if (!currentWorkflow) return;
    try {
      const imageWidth = 1024, imageHeight = 768
      const nodesBounds = getNodesBounds(getNodes());
      const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0);

      toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: '#f7f7f7',
        width: imageWidth,
        height: imageHeight,
        style: {
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      }).then((image) => {
        const a = document.createElement('a');
        a.setAttribute('download', `${currentWorkflow.name}.png`);
        a.setAttribute('href', image);
        a.click();
      });
    } catch {
      messageApi.error('Unable to Download Image')
    }
  }

  const handleRun = async () => {
    if (!currentWorkflow) return;
    try {
      await runWorkflow();
      messageApi.success('Workflow executed!');
    } catch {
      messageApi.error('Execution failed');
    }
  };

  const handleDebug = () => {
    if (!currentWorkflow) return;
    setShowExecutionPanel(true);
    setExecutionPanelTab('debug');
    setDebugRunTrigger(currentWorkflow.id);
  };

  const handleExport = async () => {
    if (!currentWorkflow) return;
    try {
      const res = await exportWorkflow(currentWorkflow.id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentWorkflow.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      messageApi.error('Failed to export');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importFlow(data);
      await fetchWorkflows();
      messageApi.success('Workflow imported!');
    } catch {
      messageApi.error('Failed to import workflow');
    }
    e.target.value = '';
  };

  const handleNew = async () => {
    if (!newName.trim()) return;
    await createNewWorkflow(newName.trim(), newDesc.trim());
    setShowNewDialog(false);
    setNewName('');
    setNewDesc('');
  };

  const handleDelete = async () => {
    if (!currentWorkflow) return;
    Modal.confirm({
      title: 'Delete Workflow',
      content: `Delete "${currentWorkflow.name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => removeWorkflow(currentWorkflow.id),
    });
  };

  return (
    <>
      {contextHolder}
      {/* Row 1: App header like Salesforce Flow Builder */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        height: 36,
        background: PRIMARY,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>⚡ Flow Builder</span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <Select
            size="small"
            variant="borderless"
            style={{ minWidth: 150, color: '#fff' }}
            placeholder="Open Workflow..."
            popupMatchSelectWidth={false}
            value={currentWorkflow?.id || undefined}
            onChange={(id) => { if (id) loadWorkflow(id); }}
            options={workflows.map((wf) => ({ value: wf.id, label: wf.name }))}
            allowClear
            showSearch
            optionFilterProp="label"
          />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            style={{ color: '#fff' }}
            onClick={() => setShowNewDialog(true)}
          >New</Button>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <Tooltip title="Connection Configs">
            <Button type="text" size="small" icon={<SettingOutlined />} style={{ color: '#fff' }} onClick={() => setShowConfigManager(true)} />
          </Tooltip>
          <Tooltip title="Config Store (secrets, tokens)">
            <Button type="text" size="small" icon={<SafetyCertificateOutlined />} style={{ color: '#fff' }} onClick={() => setShowConfigStoreManager(true)} />
          </Tooltip>
          <Tooltip title="Execution History">
            <Button
              type="text"
              size="small"
              icon={<HistoryOutlined />}
              style={{ color: showExecutionPanel ? '#ffd700' : '#fff' }}
              onClick={() => setShowExecutionPanel(!showExecutionPanel)}
            />
          </Tooltip>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button
              type="text"
              size="small"
              icon={<BulbOutlined />}
              style={{ color: '#fff' }}
              onClick={toggleDarkMode}
            />
          </Tooltip>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)' }} />
          <Tooltip title="Help">
            <Button type="text" size="small" icon={<QuestionCircleOutlined />} style={{ color: '#fff' }} />
          </Tooltip>
        </div>
      </div>

      {/* Row 2: Secondary toolbar — icons left, status + actions right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        height: 32,
        background: darkMode ? '#1f2227' : '#f3f2f2',
        borderBottom: darkMode ? '1px solid #2e3138' : '1px solid #d8dde6',
      }}>
        {/* Left icon cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <Tooltip title="Undo"><Button type="text" size="small" icon={<UndoOutlined />} style={iconBtnStyle} /></Tooltip>
          <Tooltip title="Redo"><Button type="text" size="small" icon={<RedoOutlined />} style={iconBtnStyle} /></Tooltip>
          <div style={{ width: 1, height: 16, background: '#d8dde6', margin: '0 4px' }} />
          <Tooltip title="Cut"><Button type="text" size="small" icon={<ScissorOutlined />} style={iconBtnStyle} /></Tooltip>
          <Tooltip title="Copy"><Button type="text" size="small" icon={<CopyOutlined />} style={iconBtnStyle} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteColumnOutlined />} style={iconBtnStyle} /></Tooltip>
          <div style={{ width: 1, height: 16, background: '#d8dde6', margin: '0 4px' }} />
          <Tooltip title={toolboxOpen ? 'Hide Toolbox' : 'Show Toolbox'}>
            <Button type="text" size="small" icon={<AppstoreOutlined />} style={{ ...iconBtnStyle, color: toolboxOpen ? PRIMARY : '#706e6b' }} onClick={onToggleToolbox} />
          </Tooltip>
          <Tooltip title="Execution History"><Button type="text" size="small" icon={<HistoryOutlined />} style={iconBtnStyle} onClick={() => setShowExecutionPanel(!showExecutionPanel)} /></Tooltip>
        </div>

        {/* Left divider */}
        <div style={{ width: 1, height: 20, background: '#d8dde6', flexShrink: 0 , marginLeft: 10, marginRight: 10}} />

        {/* Center: Workflow Tabs (horizontally scrollable) */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            margin: '0 6px',
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
          }}
        >
          {openTabs.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                maxWidth: '100%',
              }}
              className="hide-scrollbar"
            >
              {openTabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) { e.preventDefault(); closeTab(tab.id); }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '0 8px',
                      height: 22,
                      cursor: 'pointer',
                      background: isActive ? '#fff' : 'transparent',
                      borderRadius: 3,
                      border: isActive ? '1px solid #d8dde6' : '1px solid transparent',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#e8e8e8'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? PRIMARY : '#555',
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tab.name}
                    </span>
                    <span
                      onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                      style={{
                        fontSize: 9,
                        color: '#999',
                        lineHeight: 1,
                        width: 12,
                        height: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 2,
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#ccc'; e.currentTarget.style.color = '#333'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#999'; }}
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right divider */}
        <div style={{ width: 1, height: 20, background: '#d8dde6', flexShrink: 0, marginRight: 10 }} />

        {/* Right side: status + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {currentWorkflow && (
            <>
              <span style={{ fontSize: 11, color: '#706e6b' }}>
                {currentWorkflow.updatedAt ? `Saved ${timeAgo(currentWorkflow.updatedAt)}` : ''}
              </span>
              <Tag color="default" style={{ margin: 0, fontSize: 10, fontWeight: 600, lineHeight: '16px' }}>DRAFT</Tag>
            </>
          )}
          <div style={{ width: 1, height: 14, background: '#d8dde6', margin: '0 2px' }} />
          <Button type="text" size="small" onClick={handleRun} disabled={!currentWorkflow} icon={<PlayCircleOutlined style={{ color: '#389e0d' }} />} style={{ color: '#389e0d', fontWeight: 600, fontSize: 11 }}>Run</Button>
          <Button type="text" size="small" onClick={handleDebug} disabled={!currentWorkflow} icon={<BugOutlined style={{ color: '#d48806' }} />} style={{ color: '#d48806', fontWeight: 600, fontSize: 11 }}>Debug</Button>
          <Button type="text" size="small" onClick={handleExport} disabled={!currentWorkflow} icon={<ExportOutlined style={{ color: '#1677ff' }} />} style={{ color: '#1677ff', fontWeight: 600, fontSize: 11 }}>Export</Button>
          <Button type="text" size="small" onClick={handleImport} icon={<ImportOutlined style={{ color: '#722ed1' }} />} style={{ color: '#722ed1', fontWeight: 600, fontSize: 11 }}>Import</Button>
          <Button type="text" size="small" onClick={handleDelete} disabled={!currentWorkflow} icon={<DeleteOutlined style={{ color: '#cf1322' }} />} style={{ color: '#cf1322', fontWeight: 600, fontSize: 11 }}>Delete</Button>
          <Button type="text" size="small" onClick={handleSave} disabled={!currentWorkflow} icon={<SaveOutlined style={{ color: '#08979c' }} />} style={{ color: '#08979c', fontWeight: 600, fontSize: 11 }}>Save</Button>
          <Button type="text" size="small" onClick={handleDownload} disabled={!currentWorkflow} icon={<FileImageFilled style={{ color: '#08979c' }} />} style={{ color: '#08979c', fontWeight: 600, fontSize: 11 }}>PNG</Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <ConfigManager open={showConfigManager} onClose={() => setShowConfigManager(false)} />
      <ConfigStoreManager open={showConfigStoreManager} onClose={() => setShowConfigStoreManager(false)} />
      <ScheduleManager open={showScheduleManager} onClose={() => setShowScheduleManager(false)} />
      <RedisSubscriptionManager open={showRedisSubManager} onClose={() => setShowRedisSubManager(false)} />
      <EmailTriggerManager open={showEmailTriggerManager} onClose={() => setShowEmailTriggerManager(false)} />
      <HttpTriggerManager open={showHttpTriggerManager} onClose={() => setShowHttpTriggerManager(false)} />

      <Modal
        title="Create New Workflow"
        open={showNewDialog}
        onOk={handleNew}
        onCancel={() => setShowNewDialog(false)}
        okText="Create"
        width={380}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Name</label>
            <Input
              size="small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My Workflow"
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Description</label>
            <TextArea
              size="small"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description..."
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  color: '#706e6b',
  width: 24,
  height: 24,
  fontSize: 12,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
