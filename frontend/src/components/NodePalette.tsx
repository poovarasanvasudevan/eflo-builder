import { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import Tabs, { TabList, Tab, TabPanel } from '@atlaskit/tabs';
import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import ModalDialog, { ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import type { Workflow, WorkflowFolder } from '../api/client';
import { PRIMARY } from '../theme';
import { useToast } from '../context/ToastContext';
import { Icons } from './ui/Icons';
import { SimpleTree, type SimpleTreeNode } from './ui/SimpleTree';

interface NodeItem {
  type: string;
  label: string;
  color: string;
  bg: string;
}

function NodeIcon({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <div
      className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: bg, color }}
    >
      {label[0]}
    </div>
  );
}

const CATEGORIES: { title: string; items: NodeItem[] }[] = [
  { title: 'Triggers', items: [{ type: 'start', label: 'Start', color: '#fff', bg: '#4bc076' }, { type: 'cron', label: 'Cron', color: '#fff', bg: '#2e7d32' }, { type: 'redis_subscribe', label: 'Redis Subscribe', color: '#fff', bg: '#c0392b' }] },
  { title: 'Network', items: [{ type: 'http_in', label: 'HTTP In', color: '#fff', bg: '#3498db' }, { type: 'http_out', label: 'HTTP Out', color: '#fff', bg: '#2ecc71' }, { type: 'graphql', label: 'GraphQL', color: '#fff', bg: '#e535ab' }] },
  { title: 'Files', items: [{ type: 'read_file', label: 'Read File', color: '#fff', bg: '#2980b9' }, { type: 'write_file', label: 'Write File', color: '#fff', bg: '#27ae60' }] },
  { title: 'Email', items: [{ type: 'email', label: 'Send Email', color: '#fff', bg: '#8e44ad' }, { type: 'email_receive', label: 'Receive Email', color: '#fff', bg: '#6c3483' }] },
  { title: 'Database', items: [{ type: 'database', label: 'Database', color: '#fff', bg: '#2980b9' }, { type: 'redis', label: 'Redis', color: '#fff', bg: '#d63031' }] },
  { title: 'Logic', items: [{ type: 'condition', label: 'Decision', color: '#fff', bg: '#f49756' }, { type: 'switch', label: 'Switch', color: '#fff', bg: '#e67e22' }, { type: 'delay', label: 'Delay', color: '#fff', bg: '#f4c542' }, { type: 'transform', label: 'Transform', color: '#fff', bg: '#f49756' }, { type: 'function', label: 'Function', color: '#fff', bg: '#9b59b6' }] },
  { title: 'Actions', items: [{ type: 'http_request', label: 'HTTP Request', color: '#fff', bg: PRIMARY }, { type: 'log', label: 'Log', color: '#fff', bg: '#54b7d3' }, { type: 'exec', label: 'Exec Command', color: '#fff', bg: '#2c3e50' }, { type: 'ssh', label: 'SSH', color: '#fff', bg: '#16a085' }] },
  { title: 'Config Store', items: [{ type: 'get_config_store', label: 'Get Config Store', color: '#fff', bg: '#16a085' }, { type: 'set_config_store', label: 'Set Config Store', color: '#fff', bg: '#1abc9c' }] },
  { title: 'Flow', items: [{ type: 'flow', label: 'Sub-Flow', color: '#fff', bg: '#1a5276' }, { type: 'continue', label: 'Continue', color: '#fff', bg: '#16a085' }, { type: 'end', label: 'End', color: '#fff', bg: '#e8647c' }] },
];

export interface TriggerTabCallbacks {
  onOpenScheduleManager?: () => void;
  onOpenRedisSubManager?: () => void;
  onOpenEmailTriggerManager?: () => void;
  onOpenHttpTriggerManager?: () => void;
}

interface NodePaletteProps extends TriggerTabCallbacks {}

const TRIGGER_ITEMS: { key: string; label: string; bg: string; onClickKey: keyof TriggerTabCallbacks }[] = [
  { key: 'cron', label: 'Cron Schedules', bg: '#2e7d32', onClickKey: 'onOpenScheduleManager' },
  { key: 'redis', label: 'Redis Subscriptions', bg: '#c0392b', onClickKey: 'onOpenRedisSubManager' },
  { key: 'email', label: 'Email Triggers', bg: '#6c3483', onClickKey: 'onOpenEmailTriggerManager' },
  { key: 'http', label: 'HTTP Triggers', bg: '#3498db', onClickKey: 'onOpenHttpTriggerManager' },
];

const FOLDER_KEY_PREFIX = 'folder-';
const FLOW_KEY_PREFIX = 'flow-';

function buildFlowTreeForParent(
  parentId: number | null,
  folders: WorkflowFolder[],
  workflows: Workflow[],
  opts: { renderFolderTitle: (f: WorkflowFolder) => ReactNode; renderFlowTitle: (w: Workflow) => ReactNode }
): SimpleTreeNode[] {
  const childFolders = folders.filter((f) => (f.parentId ?? null) === parentId);
  const childFlows = workflows.filter((w) => (w.folderId ?? null) === parentId);
  const folderNodes: SimpleTreeNode[] = childFolders.map((f) => ({
    key: FOLDER_KEY_PREFIX + f.id,
    title: opts.renderFolderTitle(f),
    children: buildFlowTreeForParent(f.id, folders, workflows, opts),
    isLeaf: false,
  }));
  const flowNodes: SimpleTreeNode[] = childFlows.map((w) => ({
    key: FLOW_KEY_PREFIX + w.id,
    title: opts.renderFlowTitle(w),
    isLeaf: true,
  }));
  return [...folderNodes, ...flowNodes].sort((a, b) => {
    const aIsFolder = String(a.key).startsWith(FOLDER_KEY_PREFIX);
    const bIsFolder = String(b.key).startsWith(FOLDER_KEY_PREFIX);
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return String(a.key).localeCompare(String(b.key));
  });
}

export default function NodePalette({
  onOpenScheduleManager,
  onOpenRedisSubManager,
  onOpenEmailTriggerManager,
  onOpenHttpTriggerManager,
}: NodePaletteProps = {}) {
  const {
    workflows,
    folders,
    currentWorkflow,
    loadWorkflow,
    openTabs,
    fetchWorkflows,
    fetchFolders,
    createNewWorkflow,
    removeWorkflow,
    createFolder,
    updateFolder,
    deleteFolder,
    updateWorkflowName,
  } = useWorkflowStore();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [newFlowModal, setNewFlowModal] = useState<{ open: boolean; folderId: number | null }>({ open: false, folderId: null });
  const [newFolderModal, setNewFolderModal] = useState<{ open: boolean; parentId: number | null }>({ open: false, parentId: null });
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ key: string; x: number; y: number } | null>(null);
  const [renameModal, setRenameModal] = useState<{ open: boolean; type: 'folder' | 'flow'; id: number; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'folder' | 'flow'; id: number; name?: string; onConfirm: () => void } | null>(null);
  const triggerCallbacks = { onOpenScheduleManager, onOpenRedisSubManager, onOpenEmailTriggerManager, onOpenHttpTriggerManager };

  useEffect(() => {
    fetchWorkflows();
    fetchFolders();
  }, [fetchWorkflows, fetchFolders]);

  const handleCreateFlow = async (folderId: number | null) => {
    if (!newFlowName.trim()) return;
    await createNewWorkflow(newFlowName.trim(), newFlowDesc.trim(), folderId);
    setNewFlowModal({ open: false, folderId: null });
    setNewFlowName('');
    setNewFlowDesc('');
    toast.success('Flow created');
  };

  const handleCreateFolder = async (parentId: number | null) => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim(), parentId);
    setNewFolderModal({ open: false, parentId: null });
    setNewFolderName('');
    toast.success('Folder created');
  };

  const handleRename = async () => {
    if (!renameModal || !renameValue.trim()) return;
    if (renameModal.type === 'folder') {
      await updateFolder(renameModal.id, { name: renameValue.trim() });
      toast.success('Folder renamed');
    } else {
      await updateWorkflowName(renameModal.id, renameValue.trim());
      toast.success('Flow renamed');
    }
    setRenameModal(null);
    setRenameValue('');
  };

  const handleDeleteFolder = (id: number) => {
    setContextMenu(null);
    setDeleteConfirm({ type: 'folder', id, onConfirm: () => { deleteFolder(id); setDeleteConfirm(null); } });
  };

  const handleDeleteFlow = (wf: Workflow) => {
    setContextMenu(null);
    setDeleteConfirm({ type: 'flow', id: wf.id, name: wf.name, onConfirm: () => { removeWorkflow(wf.id); setDeleteConfirm(null); } });
  };

  const flowTreeData = useMemo(() => {
    return buildFlowTreeForParent(null, folders, workflows, {
      renderFolderTitle: (f) => <span className="text-[11px] font-medium">{f.name}</span>,
      renderFlowTitle: (w) => {
        const isActive = currentWorkflow?.id === w.id;
        const isOpen = openTabs.some((t) => t.id === w.id);
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px]" style={{ color: isActive ? PRIMARY : '#706e6b' }}>⚡</span>
            <span className={`text-[11px] overflow-hidden text-ellipsis whitespace-nowrap ${isActive ? 'font-semibold' : 'font-medium'}`}>{w.name}</span>
            {isActive && <Lozenge appearance="success">ACTIVE</Lozenge>}
            {!isActive && isOpen && <Lozenge appearance="default">OPEN</Lozenge>}
          </div>
        );
      },
    });
  }, [folders, workflows, currentWorkflow?.id, openTabs]);

  const getContextMenuItems = (key: string) => {
    const close = () => setContextMenu(null);
    const isFolder = key.startsWith(FOLDER_KEY_PREFIX);
    const id = parseInt(key.replace(FOLDER_KEY_PREFIX, '').replace(FLOW_KEY_PREFIX, ''), 10);
    if (isFolder) {
      return [
        { label: 'New subfolder', onClick: () => { setNewFolderModal({ open: true, parentId: id }); close(); } },
        { label: 'New flow', onClick: () => { setNewFlowModal({ open: true, folderId: id }); close(); } },
        { label: 'Rename', onClick: () => { const f = folders.find((x) => x.id === id); if (f) { setRenameModal({ open: true, type: 'folder', id, name: f.name }); setRenameValue(f.name); } close(); } },
        { label: 'Delete', danger: true, onClick: () => handleDeleteFolder(id) },
      ];
    }
    const wf = workflows.find((w) => w.id === id);
    if (!wf) return [];
    return [
      { label: 'Open', onClick: () => { loadWorkflow(id); close(); } },
      { label: 'Rename', onClick: () => { setRenameModal({ open: true, type: 'flow', id, name: wf.name }); setRenameValue(wf.name); close(); } },
      { label: 'Delete', danger: true, onClick: () => handleDeleteFlow(wf) },
    ];
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES
      .map((cat) => ({ ...cat, items: cat.items.filter((item) => item.label.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)) }))
      .filter((cat) => cat.items.length > 0);
  }, [search]);

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex-1 overflow-auto">
      <Tabs id="node-palette-tabs" selected={activeTab} onChange={(idx) => setActiveTab(idx)}>
        <TabList>
          <Tab>Trigger</Tab>
          <Tab>Elements</Tab>
          <Tab>Flows</Tab>
        </TabList>
        <TabPanel>
          <div className="pb-2">
            <div className="text-[10px] font-bold text-[#706e6b] uppercase tracking-wide mb-1.5 px-0.5">Trigger configs</div>
            {TRIGGER_ITEMS.map((item) => {
              const onClick = triggerCallbacks[item.onClickKey];
              return (
                <div
                  key={item.key}
                  onClick={() => onClick?.()}
                  className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-black/5 transition-colors"
                >
                  <NodeIcon label={item.label} bg={item.bg} color="#fff" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="pb-2">
            <div className="mb-1.5 flex items-center gap-1">
              <span className="text-[#b0b0b0] text-[11px]">🔍</span>
              <TextField
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
            </div>
            {filteredCategories.length === 0 && (
              <div className="py-3 px-1 text-[#706e6b] text-[11px] text-center">
                No nodes match &quot;{search}&quot;
              </div>
            )}
            {filteredCategories.map((cat) => (
              <div key={cat.title} className="mb-1.5">
                <div className="text-[10px] font-bold text-[#706e6b] uppercase tracking-wide mb-0.5 px-0.5">{cat.title}</div>
                {cat.items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, item.type, item.label)}
                    className="flex items-center gap-2 py-1 px-1.5 rounded cursor-grab transition-colors hover:bg-black/5"
                  >
                    <NodeIcon label={item.label} bg={item.bg} color={item.color} />
                    <span className="text-[11px]">{item.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="pb-2">
            <div className="flex gap-1 mb-1.5 flex-wrap">
              <Button appearance="subtle" onClick={() => setNewFolderModal({ open: true, parentId: null })} className="!text-xs !px-1.5">
                <span className="flex items-center gap-1"><Icons.Folder /> New folder</span>
              </Button>
              <Button appearance="subtle" onClick={() => setNewFlowModal({ open: true, folderId: null })} className="!text-xs !px-1.5">
                <span className="flex items-center gap-1"><Icons.FileText /> New flow</span>
              </Button>
            </div>
            {flowTreeData.length === 0 ? (
              <div className="py-4 px-1 text-[#706e6b] text-[11px] text-center">No folders or flows yet. Use the buttons above or right-click to add.</div>
            ) : (
              <>
                <SimpleTree
                  treeData={flowTreeData}
                  defaultExpandAll
                  onSelect={(key) => {
                    if (key.startsWith(FLOW_KEY_PREFIX)) {
                      const id = parseInt(key.slice(FLOW_KEY_PREFIX.length), 10);
                      loadWorkflow(id);
                    }
                  }}
                  onRightClick={(key, x, y) => setContextMenu({ key, x, y })}
                />
                {contextMenu && (
                  <>
                    <div role="presentation" className="fixed inset-0 z-[1049]" onClick={() => setContextMenu(null)} />
                    <div
                      className="fixed z-[1050] rounded bg-white shadow-lg min-w-[160px] py-1 border border-[#dfe1e6]"
                      style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                      {getContextMenuItems(contextMenu.key).map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={item.onClick}
                          className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-black/5 ${item.danger ? 'text-red-600' : ''}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </TabPanel>
      </Tabs>

      {newFlowModal.open && (
        <ModalDialog onClose={() => setNewFlowModal({ open: false, folderId: null })}>
          <ModalHeader><ModalTitle>New flow</ModalTitle></ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-2">
              <TextField placeholder="Flow name" value={newFlowName} onChange={(e) => setNewFlowName(e.currentTarget.value)} />
              <textarea className="w-full min-h-[60px] p-2 border border-[#dfe1e6] rounded text-sm" placeholder="Description (optional)" value={newFlowDesc} onChange={(e) => setNewFlowDesc(e.target.value)} rows={2} />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={() => handleCreateFlow(newFlowModal.folderId)}>Create</Button>
            <Button appearance="subtle" onClick={() => setNewFlowModal({ open: false, folderId: null })}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {newFolderModal.open && (
        <ModalDialog onClose={() => setNewFolderModal({ open: false, parentId: null })}>
          <ModalHeader><ModalTitle>New folder</ModalTitle></ModalHeader>
          <ModalBody>
            <TextField placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.currentTarget.value)} />
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={() => handleCreateFolder(newFolderModal.parentId)}>Create</Button>
            <Button appearance="subtle" onClick={() => setNewFolderModal({ open: false, parentId: null })}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {renameModal && (
        <ModalDialog onClose={() => { setRenameModal(null); setRenameValue(''); }}>
          <ModalHeader><ModalTitle>{renameModal.type === 'folder' ? 'Rename folder' : 'Rename flow'}</ModalTitle></ModalHeader>
          <ModalBody>
            <TextField placeholder="Name" value={renameValue} onChange={(e) => setRenameValue(e.currentTarget.value)} />
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={handleRename}>Rename</Button>
            <Button appearance="subtle" onClick={() => { setRenameModal(null); setRenameValue(''); }}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}

      {deleteConfirm && (
        <ModalDialog onClose={() => setDeleteConfirm(null)}>
          <ModalHeader><ModalTitle>Delete {deleteConfirm.type}</ModalTitle></ModalHeader>
          <ModalBody>
            <p>{deleteConfirm.type === 'folder' ? 'Contents will be moved to the parent. Continue?' : `Delete "${deleteConfirm.name}"?`}</p>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" className="!bg-red-600 hover:!bg-red-700" onClick={deleteConfirm.onConfirm}>Delete</Button>
            <Button appearance="subtle" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          </ModalFooter>
        </ModalDialog>
      )}
    </div>
  );
}
