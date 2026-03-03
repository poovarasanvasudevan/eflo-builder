import { useRef, useState } from 'react';
import Button from '@atlaskit/button';
import Tooltip from '@atlaskit/tooltip';
import Lozenge from '@atlaskit/lozenge';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import TextField from '@atlaskit/textfield';
import { useWorkflowStore } from '../store/workflowStore';
import { exportWorkflow } from '../api/client';
import { PRIMARY } from '../theme';
import { useToast } from '../context/ToastContext';
import { Icons } from './ui/Icons';
import ConfigManager from './ConfigManager';
import ConfigStoreManager from './ConfigStoreManager';
import ScheduleManager from './ScheduleManager';
import RedisSubscriptionManager from './RedisSubscriptionManager';
import EmailTriggerManager from './EmailTriggerManager';
import HttpTriggerManager from './HttpTriggerManager';
import { getNodesBounds, getViewportForBounds, useReactFlow } from '@xyflow/react';
import { toPng } from 'html-to-image';

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
  const toast = useToast();
  const { getNodes } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ name: string; onConfirm: () => void } | null>(null);

  const handleSave = async () => {
    if (!currentWorkflow) return;
    try {
      await saveWorkflow();
      toast.success('Workflow saved!');
    } catch {
      toast.error('Failed to save workflow');
    }
  };

  const handleDownload = async () => {
    if (!currentWorkflow) return;
    try {
      const imageWidth = 1024,
        imageHeight = 768;
      const nodesBounds = getNodesBounds(getNodes());
      const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0);
      toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
        backgroundColor: '#f7f7f7',
        width: imageWidth,
        height: imageHeight,
        style: { transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` },
      }).then((image) => {
        const a = document.createElement('a');
        a.setAttribute('download', `${currentWorkflow.name}.png`);
        a.setAttribute('href', image);
        a.click();
      });
    } catch {
      toast.error('Unable to Download Image');
    }
  };

  const handleRun = async () => {
    if (!currentWorkflow) return;
    try {
      await runWorkflow();
      toast.success('Workflow executed!');
    } catch {
      toast.error('Execution failed');
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
      toast.error('Failed to export');
    }
  };

  const handleImport = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importFlow(data);
      await fetchWorkflows();
      toast.success('Workflow imported!');
    } catch {
      toast.error('Failed to import workflow');
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

  const handleDelete = () => {
    if (!currentWorkflow) return;
    setDeleteConfirm({
      name: currentWorkflow.name,
      onConfirm: () => {
        removeWorkflow(currentWorkflow.id);
        setDeleteConfirm(null);
      },
    });
  };

  const iconBtnStyle = 'text-[#706e6b] w-6 h-6 flex items-center justify-center [&_span]:!text-current';

  return (
    <>
      <div className="flex items-center px-3 h-[42px] text-white" style={{ background: PRIMARY }}>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold tracking-wide">⚡ Flow Builder</span>
          <div className="w-px h-4 bg-white/30" />
          <select
            className="min-w-[150px] h-7 px-2 rounded text-sm bg-transparent text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-white/50"
            value={currentWorkflow?.id ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              if (id) loadWorkflow(id);
            }}
          >
            <option value="">Open Workflow...</option>
            {workflows.map((wf) => (
              <option key={wf.id} value={wf.id} className="text-gray-900">
                {wf.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button appearance="subtle" onClick={() => setShowNewDialog(true)} className="!text-white [&_span]:!text-white">
            <span className="flex items-center gap-1.5">
              <Icons.Plus /> New
            </span>
          </Button>
          <div className="w-px h-4 bg-white/30" />
          <Tooltip content="Connection Configs">
            <Button appearance="subtle" className={iconBtnStyle} onClick={() => setShowConfigManager(true)}>
              <Icons.Settings />
            </Button>
          </Tooltip>
          <Tooltip content="Config Store (secrets, tokens)">
            <Button appearance="subtle" className={iconBtnStyle} onClick={() => setShowConfigStoreManager(true)}>
              <Icons.Safety />
            </Button>
          </Tooltip>
          <Tooltip content="Execution History">
            <Button
              appearance="subtle"
              className={iconBtnStyle}
              style={{ color: showExecutionPanel ? '#ffd700' : '#fff' }}
              onClick={() => setShowExecutionPanel(!showExecutionPanel)}
            >
              <Icons.History />
            </Button>
          </Tooltip>
          <div className="w-px h-4 bg-white/30" />
          <Tooltip content={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button appearance="subtle" className="!text-white [&_span]:!text-white" onClick={toggleDarkMode}>
              <Icons.Lightbulb />
            </Button>
          </Tooltip>
          <div className="w-px h-4 bg-white/30" />
          <Tooltip content="Help">
            <Button appearance="subtle" className="!text-white [&_span]:!text-white">
              <Icons.Question />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div
        className="flex items-center px-2 h-8 border-b"
        style={{
          background: darkMode ? '#1f2227' : '#f3f2f2',
          borderColor: darkMode ? '#2e3138' : '#d8dde6',
        }}
      >
        <div className="flex items-center gap-0">
          <Tooltip content="Undo">
            <Button appearance="subtle" className={iconBtnStyle} />
          </Tooltip>
          <Tooltip content="Redo">
            <Button appearance="subtle" className={iconBtnStyle} />
          </Tooltip>
          <div className="w-px h-4 bg-[#d8dde6] mx-1" />
          <Tooltip content="Cut">
            <Button appearance="subtle" className={iconBtnStyle}><Icons.Scissor /></Button>
          </Tooltip>
          <Tooltip content="Copy">
            <Button appearance="subtle" className={iconBtnStyle}><Icons.Copy /></Button>
          </Tooltip>
          <Tooltip content="Delete">
            <Button appearance="subtle" className={iconBtnStyle}><Icons.TableColumnDelete /></Button>
          </Tooltip>
          <div className="w-px h-4 bg-[#d8dde6] mx-1" />
          <Tooltip content={toolboxOpen ? 'Hide Toolbox' : 'Show Toolbox'}>
            <Button
              appearance="subtle"
              className={iconBtnStyle}
              style={{ color: toolboxOpen ? PRIMARY : '#706e6b' }}
              onClick={onToggleToolbox}
            >
              <Icons.Appstore />
            </Button>
          </Tooltip>
          <Tooltip content="Execution History">
            <Button appearance="subtle" className={iconBtnStyle} onClick={() => setShowExecutionPanel(!showExecutionPanel)}>
              <Icons.History />
            </Button>
          </Tooltip>
        </div>
        <div className="w-px h-5 bg-[#d8dde6] flex-shrink-0 mx-2" />
        <div className="flex-1 overflow-hidden mx-1.5 flex items-center min-w-0">
          {openTabs.length > 0 && (
            <div className="flex items-center gap-0.5 overflow-x-auto max-w-full hide-scrollbar">
              {openTabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => switchTab(tab.id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        closeTab(tab.id);
                      }
                    }}
                    className={`flex items-center gap-1 px-2 h-[22px] cursor-pointer rounded border whitespace-nowrap flex-shrink-0 transition-all ${
                      isActive ? 'bg-white border-[#d8dde6]' : 'bg-transparent border-transparent hover:bg-[#e8e8e8]'
                    }`}
                  >
                    <span
                      className="text-[10px] max-w-[120px] overflow-hidden text-ellipsis"
                      style={{ fontWeight: isActive ? 600 : 400, color: isActive ? PRIMARY : '#555' }}
                    >
                      {tab.name}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="text-[9px] w-3 h-3 flex items-center justify-center rounded text-[#999] hover:bg-[#ccc] hover:text-[#333]"
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-[#d8dde6] flex-shrink-0 mr-2" />
        <div className="flex items-center gap-1">
          {currentWorkflow && (
            <>
              <span className="text-[11px] text-[#706e6b]">
                {currentWorkflow.updatedAt ? `Saved ${timeAgo(currentWorkflow.updatedAt)}` : ''}
              </span>
              <Lozenge appearance="default">DRAFT</Lozenge>
            </>
          )}
          <div className="w-px h-3.5 bg-[#d8dde6] mx-0.5" />
          <Button appearance="subtle" onClick={handleRun} isDisabled={!currentWorkflow} className="!text-green-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Play /> Run</span>
          </Button>
          <Button appearance="subtle" onClick={handleDebug} isDisabled={!currentWorkflow} className="!text-amber-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Bug /> Debug</span>
          </Button>
          <Button appearance="subtle" onClick={handleExport} isDisabled={!currentWorkflow} className="!text-blue-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Download /> Export</span>
          </Button>
          <Button appearance="subtle" onClick={handleImport} className="!text-violet-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Upload /> Import</span>
          </Button>
          <Button appearance="subtle" onClick={handleDelete} isDisabled={!currentWorkflow} className="!text-red-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Delete /> Delete</span>
          </Button>
          <Button appearance="subtle" onClick={handleSave} isDisabled={!currentWorkflow} className="!text-teal-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Save /> Save</span>
          </Button>
          <Button appearance="subtle" onClick={handleDownload} isDisabled={!currentWorkflow} className="!text-teal-600 font-semibold text-[11px]">
            <span className="flex items-center gap-1"><Icons.Image /> PNG</span>
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

      <ConfigManager open={showConfigManager} onClose={() => setShowConfigManager(false)} />
      <ConfigStoreManager open={showConfigStoreManager} onClose={() => setShowConfigStoreManager(false)} />
      <ScheduleManager open={showScheduleManager} onClose={() => setShowScheduleManager(false)} />
      <RedisSubscriptionManager open={showRedisSubManager} onClose={() => setShowRedisSubManager(false)} />
      <EmailTriggerManager open={showEmailTriggerManager} onClose={() => setShowEmailTriggerManager(false)} />
      <HttpTriggerManager open={showHttpTriggerManager} onClose={() => setShowHttpTriggerManager(false)} />

      {showNewDialog && (
        <ModalDialog onClose={() => setShowNewDialog(false)}>
          <ModalHeader>
            <ModalTitle>Create New Workflow</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold">Name</label>
              <TextField value={newName} onChange={(e) => setNewName(e.currentTarget.value)} placeholder="My Workflow" />
              <label className="text-xs font-semibold">Description</label>
              <textarea
                className="w-full min-h-[60px] p-2 border border-[#dfe1e6] rounded text-sm"
                placeholder="Description..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={handleNew}>
              Create
            </Button>
            <Button appearance="subtle" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {deleteConfirm && (
        <ModalDialog onClose={() => setDeleteConfirm(null)}>
          <ModalHeader>
            <ModalTitle>Delete Workflow</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p>Delete &quot;{deleteConfirm.name}&quot;?</p>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={deleteConfirm.onConfirm} className="!bg-red-600 hover:!bg-red-700">
              Delete
            </Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </>
  );
}

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
