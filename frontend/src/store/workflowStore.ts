import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getExecutions,
  getExecutionLogs,
  importWorkflow,
  getConfigs,
  createConfig,
  updateConfig as updateConfigApi,
  deleteConfig as deleteConfigApi,
  getSchedules,
  createSchedule,
  updateSchedule as updateScheduleApi,
  deleteSchedule as deleteScheduleApi,
  getRedisSubscriptions,
  createRedisSubscription,
  updateRedisSubscription as updateRedisSubApi,
  deleteRedisSubscription as deleteRedisSubApi,
  getEmailTriggers,
  createEmailTrigger,
  updateEmailTrigger as updateEmailTriggerApi,
  deleteEmailTrigger as deleteEmailTriggerApi,
  type Workflow,
  type Execution,
  type ExecutionLog,
  type NodeConfig,
  type CronSchedule,
  type RedisSubscription,
  type EmailTrigger,
} from '../api/client';

interface OpenTab {
  id: number;
  name: string;
}

interface TabCanvasState {
  nodes: Node[];
  edges: Edge[];
}

interface WorkflowState {
  // Workflow list
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  loading: boolean;

  // Tab state
  openTabs: OpenTab[];
  activeTabId: number | null;
  tabStates: Record<number, TabCanvasState>;

  // Canvas state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Execution state
  executions: Execution[];
  executionLogs: ExecutionLog[];
  showExecutionPanel: boolean;

  // Config state
  configs: NodeConfig[];

  // Schedule state
  schedules: CronSchedule[];

  // Redis subscription state
  redisSubs: RedisSubscription[];

  // Email trigger state
  emailTriggers: EmailTrigger[];

  // Getters
  getSelectedNode: () => Node | null;

  // Actions - workflow CRUD
  fetchWorkflows: () => Promise<void>;
  loadWorkflow: (id: number) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  createNewWorkflow: (name: string, description: string) => Promise<void>;
  removeWorkflow: (id: number) => Promise<void>;
  importFlow: (data: any) => Promise<void>;

  // Actions - tabs
  switchTab: (id: number) => void;
  closeTab: (id: number) => void;

  // Actions - canvas
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  // Actions - execution
  runWorkflow: () => Promise<void>;
  fetchExecutions: () => Promise<void>;
  fetchExecutionLogs: (executionId: number) => Promise<void>;
  setShowExecutionPanel: (show: boolean) => void;

  // Actions - configs
  fetchConfigs: (type?: string) => Promise<void>;
  addConfig: (data: Partial<NodeConfig>) => Promise<void>;
  editConfig: (id: number, data: Partial<NodeConfig>) => Promise<void>;
  removeConfig: (id: number) => Promise<void>;

  // Actions - schedules
  fetchSchedules: (workflowId?: number) => Promise<void>;
  addSchedule: (data: Partial<CronSchedule>) => Promise<void>;
  editSchedule: (id: number, data: Partial<CronSchedule>) => Promise<void>;
  removeSchedule: (id: number) => Promise<void>;

  // Actions - redis subscriptions
  fetchRedisSubs: () => Promise<void>;
  addRedisSub: (data: Partial<RedisSubscription>) => Promise<void>;
  editRedisSub: (id: number, data: Partial<RedisSubscription>) => Promise<void>;
  removeRedisSub: (id: number) => Promise<void>;

  // Actions - email triggers
  fetchEmailTriggers: () => Promise<void>;
  addEmailTrigger: (data: Partial<EmailTrigger>) => Promise<void>;
  editEmailTrigger: (id: number, data: Partial<EmailTrigger>) => Promise<void>;
  removeEmailTrigger: (id: number) => Promise<void>;
}

// --- LocalStorage persistence for tabs ---
const TAB_STORAGE_KEY = 'eflo_open_tabs';
const ACTIVE_TAB_STORAGE_KEY = 'eflo_active_tab';

function loadTabsFromStorage(): { openTabs: OpenTab[]; activeTabId: number | null } {
  try {
    const tabs = localStorage.getItem(TAB_STORAGE_KEY);
    const active = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return {
      openTabs: tabs ? JSON.parse(tabs) : [],
      activeTabId: active ? JSON.parse(active) : null,
    };
  } catch {
    return { openTabs: [], activeTabId: null };
  }
}

function saveTabsToStorage(openTabs: OpenTab[], activeTabId: number | null) {
  try {
    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(openTabs));
    localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, JSON.stringify(activeTabId));
  } catch {
    // ignore quota errors
  }
}

const savedTabs = loadTabsFromStorage();

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflow: null,
  loading: false,
  openTabs: savedTabs.openTabs,
  activeTabId: savedTabs.activeTabId,
  tabStates: {},
  nodes: [],
  edges: [],
  selectedNodeId: null,
  executions: [],
  executionLogs: [],
  showExecutionPanel: false,
  configs: [],
  schedules: [],
  redisSubs: [],
  emailTriggers: [],

  getSelectedNode: () => {
    const { nodes, selectedNodeId } = get();
    if (!selectedNodeId) return null;
    return nodes.find((n) => n.id === selectedNodeId) || null;
  },

  fetchWorkflows: async () => {
    set({ loading: true });
    try {
      const res = await getWorkflows();
      set({ workflows: res.data || [] });
    } finally {
      set({ loading: false });
    }
  },

  loadWorkflow: async (id: number) => {
    const { openTabs, activeTabId, nodes, edges, tabStates } = get();

    // If tab already open, just switch to it
    if (openTabs.some((t) => t.id === id)) {
      if (activeTabId === id) return;
      // Save current tab state before switching
      const newTabStates = { ...tabStates };
      if (activeTabId !== null) {
        newTabStates[activeTabId] = { nodes, edges };
      }
      // Restore target tab state
      const cached = newTabStates[id];
      if (cached) {
        const res = await getWorkflow(id);
        set({
          currentWorkflow: res.data,
          nodes: cached.nodes,
          edges: cached.edges,
          activeTabId: id,
          selectedNodeId: null,
          tabStates: newTabStates,
          executions: [],
          executionLogs: [],
        });
        return;
      }
    }

    set({ loading: true });
    try {
      const res = await getWorkflow(id);
      const wf = res.data;
      const newNodes: Node[] = (wf.definition?.nodes || []).map((n) => ({
        id: n.id,
        type: n.type,
        position: { x: n.positionX, y: n.positionY },
        data: { label: n.label, properties: n.properties || {} },
      }));
      const newEdges: Edge[] = (wf.definition?.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        animated: true,
      }));

      // Save current tab state before switching
      const newTabStates = { ...tabStates };
      if (activeTabId !== null) {
        newTabStates[activeTabId] = { nodes, edges };
      }
      // Cache new tab state
      newTabStates[id] = { nodes: newNodes, edges: newEdges };

      // Add tab if not present
      const newTabs = openTabs.some((t) => t.id === id)
        ? openTabs.map((t) => (t.id === id ? { ...t, name: wf.name } : t))
        : [...openTabs, { id: wf.id, name: wf.name }];

      set({
        currentWorkflow: wf,
        nodes: newNodes,
        edges: newEdges,
        selectedNodeId: null,
        openTabs: newTabs,
        activeTabId: id,
        tabStates: newTabStates,
        executions: [],
        executionLogs: [],
      });
    } finally {
      set({ loading: false });
    }
  },

  saveWorkflow: async () => {
    const { currentWorkflow, nodes, edges, activeTabId, tabStates, openTabs } = get();
    if (!currentWorkflow) return;

    const definition = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type || 'start',
        label: (n.data as any)?.label || n.type || '',
        positionX: n.position.x,
        positionY: n.position.y,
        properties: (n.data as any)?.properties || {},
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || '',
        targetHandle: e.targetHandle || '',
        label: typeof e.label === 'string' ? e.label : '',
      })),
    };

    await updateWorkflow(currentWorkflow.id, {
      name: currentWorkflow.name,
      description: currentWorkflow.description,
      definition,
    });

    // Sync tab state cache after save
    if (activeTabId !== null) {
      const newTabStates = { ...tabStates, [activeTabId]: { nodes, edges } };
      const newTabs = openTabs.map((t) =>
        t.id === currentWorkflow.id ? { ...t, name: currentWorkflow.name } : t
      );
      set({ tabStates: newTabStates, openTabs: newTabs });
    }
  },

  createNewWorkflow: async (name: string, description: string) => {
    const { openTabs, activeTabId, nodes, edges, tabStates } = get();
    const res = await createWorkflow({
      name,
      description,
      definition: { nodes: [], edges: [] },
    });
    const wf = res.data;

    // Save current tab state
    const newTabStates = { ...tabStates };
    if (activeTabId !== null) {
      newTabStates[activeTabId] = { nodes, edges };
    }
    newTabStates[wf.id] = { nodes: [], edges: [] };

    set({
      currentWorkflow: wf,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      openTabs: [...openTabs, { id: wf.id, name: wf.name }],
      activeTabId: wf.id,
      tabStates: newTabStates,
      executions: [],
      executionLogs: [],
    });
    await get().fetchWorkflows();
  },

  removeWorkflow: async (id: number) => {
    await deleteWorkflow(id);
    // Close tab if open
    get().closeTab(id);
    await get().fetchWorkflows();
  },

  importFlow: async (data: any) => {
    const res = await importWorkflow(data);
    await get().fetchWorkflows();
    // Open imported workflow in a tab
    if (res.data?.id) {
      await get().loadWorkflow(res.data.id);
    }
  },

  switchTab: (id: number) => {
    const { openTabs, activeTabId, nodes, edges, tabStates } = get();
    if (activeTabId === id) return;
    if (!openTabs.some((t) => t.id === id)) return;

    // Save current tab's canvas state
    const newTabStates = { ...tabStates };
    if (activeTabId !== null) {
      newTabStates[activeTabId] = { nodes, edges };
    }

    // Restore target tab's state
    const cached = newTabStates[id];
    set({
      nodes: cached?.nodes || [],
      edges: cached?.edges || [],
      activeTabId: id,
      selectedNodeId: null,
      tabStates: newTabStates,
      executions: [],
      executionLogs: [],
    });

    // Fetch full workflow data
    getWorkflow(id).then((res) => {
      set({ currentWorkflow: res.data });
    });
  },

  closeTab: (id: number) => {
    const { openTabs, activeTabId, nodes, edges, tabStates } = get();
    const idx = openTabs.findIndex((t) => t.id === id);
    if (idx === -1) return;

    const newTabs = openTabs.filter((t) => t.id !== id);
    const newTabStates = { ...tabStates };
    delete newTabStates[id];

    if (activeTabId === id) {
      // Switch to adjacent tab
      const nextTab = newTabs[Math.min(idx, newTabs.length - 1)];
      if (nextTab) {
        // Save nothing (we're closing active), restore next
        const cached = newTabStates[nextTab.id];
        set({
          openTabs: newTabs,
          activeTabId: nextTab.id,
          nodes: cached?.nodes || [],
          edges: cached?.edges || [],
          selectedNodeId: null,
          tabStates: newTabStates,
          executions: [],
          executionLogs: [],
        });
        getWorkflow(nextTab.id).then((res) => {
          set({ currentWorkflow: res.data });
        });
      } else {
        // No tabs left
        set({
          openTabs: [],
          activeTabId: null,
          currentWorkflow: null,
          nodes: [],
          edges: [],
          selectedNodeId: null,
          tabStates: {},
          executions: [],
          executionLogs: [],
        });
      }
    } else {
      // Just remove the tab, keep current active
      if (activeTabId !== null) {
        newTabStates[activeTabId] = { nodes, edges };
      }
      set({ openTabs: newTabs, tabStates: newTabStates });
    }
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) });
  },

  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
  },

  setSelectedNodeId: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  updateNodeData: (nodeId: string, data: Record<string, any>) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  setNodes: (nodes: Node[]) => set({ nodes }),
  setEdges: (edges: Edge[]) => set({ edges }),

  runWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    await get().saveWorkflow();
    await executeWorkflow(currentWorkflow.id);
    await get().fetchExecutions();
    set({ showExecutionPanel: true });
  },

  fetchExecutions: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    const res = await getExecutions(currentWorkflow.id);
    set({ executions: res.data || [] });
  },

  fetchExecutionLogs: async (executionId: number) => {
    const res = await getExecutionLogs(executionId);
    set({ executionLogs: res.data || [] });
  },

  setShowExecutionPanel: (show: boolean) => set({ showExecutionPanel: show }),

  // Config actions
  fetchConfigs: async (type?: string) => {
    const res = await getConfigs(type);
    set({ configs: res.data || [] });
  },

  addConfig: async (data: Partial<NodeConfig>) => {
    await createConfig(data);
    await get().fetchConfigs();
  },

  editConfig: async (id: number, data: Partial<NodeConfig>) => {
    await updateConfigApi(id, data);
    await get().fetchConfigs();
  },

  removeConfig: async (id: number) => {
    await deleteConfigApi(id);
    await get().fetchConfigs();
  },

  // Schedule actions
  fetchSchedules: async (workflowId?: number) => {
    const res = await getSchedules(workflowId);
    set({ schedules: res.data || [] });
  },

  addSchedule: async (data: Partial<CronSchedule>) => {
    await createSchedule(data);
    await get().fetchSchedules();
  },

  editSchedule: async (id: number, data: Partial<CronSchedule>) => {
    await updateScheduleApi(id, data);
    await get().fetchSchedules();
  },

  removeSchedule: async (id: number) => {
    await deleteScheduleApi(id);
    await get().fetchSchedules();
  },

  // Redis subscription actions
  fetchRedisSubs: async () => {
    const res = await getRedisSubscriptions();
    set({ redisSubs: res.data || [] });
  },

  addRedisSub: async (data: Partial<RedisSubscription>) => {
    await createRedisSubscription(data);
    await get().fetchRedisSubs();
  },

  editRedisSub: async (id: number, data: Partial<RedisSubscription>) => {
    await updateRedisSubApi(id, data);
    await get().fetchRedisSubs();
  },

  removeRedisSub: async (id: number) => {
    await deleteRedisSubApi(id);
    await get().fetchRedisSubs();
  },

  // Email trigger actions
  fetchEmailTriggers: async () => {
    const res = await getEmailTriggers();
    set({ emailTriggers: res.data || [] });
  },

  addEmailTrigger: async (data: Partial<EmailTrigger>) => {
    await createEmailTrigger(data);
    await get().fetchEmailTriggers();
  },

  editEmailTrigger: async (id: number, data: Partial<EmailTrigger>) => {
    await updateEmailTriggerApi(id, data);
    await get().fetchEmailTriggers();
  },

  removeEmailTrigger: async (id: number) => {
    await deleteEmailTriggerApi(id);
    await get().fetchEmailTriggers();
  },
}));

// Auto-persist tabs to localStorage on every change
useWorkflowStore.subscribe((state, prevState) => {
  if (state.openTabs !== prevState.openTabs || state.activeTabId !== prevState.activeTabId) {
    saveTabsToStorage(state.openTabs, state.activeTabId);
  }
});

// Restore the active tab on startup (call from App useEffect)
export async function restoreTabsOnStartup() {
  const { openTabs, activeTabId, loadWorkflow } = useWorkflowStore.getState();
  if (activeTabId && openTabs.some((t) => t.id === activeTabId)) {
    await loadWorkflow(activeTabId);
  }
}

