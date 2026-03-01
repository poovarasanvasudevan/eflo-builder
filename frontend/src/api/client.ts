import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface WorkflowDef {
  nodes: NodeDef[];
  edges: EdgeDef[];
}

export interface NodeDef {
  id: string;
  type: string;
  label: string;
  positionX: number;
  positionY: number;
  properties?: Record<string, any>;
}

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: number;
  name: string;
  description: string;
  definition: WorkflowDef;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  avgRunTimeSec?: number;
}

export interface Execution {
  id: number;
  workflowId: number;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface ExecutionLog {
  id: number;
  executionId: number;
  nodeId: string;
  nodeType: string;
  status: string;
  input?: string;
  output?: string;
  error?: string;
  executedAt: string;
}

export interface ExecutionDayStat {
  date: string;
  count: number;
  avgDurationSec: number;
  totalDurationSec: number;
}

export interface ExecutionStats {
  totalCount: number;
  totalDurationSec: number;
  avgDurationSec: number;
  minDurationSec: number;
  maxDurationSec: number;
  byDay: ExecutionDayStat[];
}

export interface NodeConfig {
  id: number;
  name: string;
  type: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Workflows
export const getWorkflows = () => api.get<Workflow[]>('/workflows');
export const getWorkflow = (id: number) => api.get<Workflow>(`/workflows/${id}`);
export const createWorkflow = (data: Partial<Workflow>) => api.post<Workflow>('/workflows', data);
export const updateWorkflow = (id: number, data: Partial<Workflow>) => api.put<Workflow>(`/workflows/${id}`, data);
export const deleteWorkflow = (id: number) => api.delete(`/workflows/${id}`);

// Import/Export
export const exportWorkflow = (id: number) => api.get(`/workflows/${id}/export`);
export const importWorkflow = (data: any) => api.post<Workflow>('/workflows/import', data);

// Executions
export const executeWorkflow = (id: number) => api.post(`/workflows/${id}/execute`);
export const getExecutions = (workflowId: number) => api.get<Execution[]>(`/workflows/${workflowId}/executions`);
/** Debug run: POST and stream SSE events. Calls onEvent for each event, onDone when stream ends. */
export async function executeWorkflowDebug(
  workflowId: number,
  onEvent: (ev: DebugEvent) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const baseURL = api.defaults.baseURL || '';
  const url = baseURL.startsWith('http') ? `${baseURL}/workflows/${workflowId}/execute/debug` : `${window.location.origin}${baseURL}/workflows/${workflowId}/execute/debug`;
  const res = await fetch(url, { method: 'POST', headers: { Accept: 'text/event-stream' } });
  if (!res.ok) {
    onError(res.statusText || 'Request failed');
    onDone();
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    onError('No response body');
    onDone();
    return;
  }
  const dec = new TextDecoder();
  let buf = '';
  const parseDataLine = (line: string): void => {
    if (!line.startsWith('data: ')) return;
    const raw = line.slice(6).replace(/\r$/, '').trim();
    if (!raw) return;
    try {
      const ev = JSON.parse(raw) as DebugEvent;
      onEvent(ev);
    } catch {
      // skip malformed
    }
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() || '';
      for (const line of lines) {
        parseDataLine(line);
      }
    }
    if (buf.length > 0) parseDataLine(buf);
  } catch (e) {
    onError(e instanceof Error ? e.message : 'Stream error');
  } finally {
    onDone();
  }
}

export interface DebugEvent {
  executionId: number;
  event: string;
  nodeId?: string;
  nodeType?: string;
  nodeLabel?: string;
  status: string;
  input?: string;
  output?: string;
  error?: string;
  executedAt: string;
}
export const getExecution = (id: number) => api.get<Execution>(`/executions/${id}`);
export const getExecutionLogs = (id: number) => api.get<ExecutionLog[]>(`/executions/${id}/logs`);
export const getExecutionStats = (days?: number) =>
  api.get<ExecutionStats>('/stats/executions', days != null ? { params: { days } } : undefined);

// Node Configs
export const getConfigs = (type?: string) => api.get<NodeConfig[]>('/configs', { params: type ? { type } : {} });
export const getConfig = (id: number) => api.get<NodeConfig>(`/configs/${id}`);
export const createConfig = (data: Partial<NodeConfig>) => api.post<NodeConfig>('/configs', data);
export const updateConfig = (id: number, data: Partial<NodeConfig>) => api.put<NodeConfig>(`/configs/${id}`, data);
export const deleteConfig = (id: number) => api.delete(`/configs/${id}`);

// Cron Schedules
export interface CronSchedule {
  id: number;
  workflowId: number;
  expression: string;
  timezone: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const getSchedules = (workflowId?: number) =>
  api.get<CronSchedule[]>('/schedules', { params: workflowId ? { workflowId } : {} });
export const getSchedule = (id: number) => api.get<CronSchedule>(`/schedules/${id}`);
export const createSchedule = (data: Partial<CronSchedule>) => api.post<CronSchedule>('/schedules', data);
export const updateSchedule = (id: number, data: Partial<CronSchedule>) =>
  api.put<CronSchedule>(`/schedules/${id}`, data);
export const deleteSchedule = (id: number) => api.delete(`/schedules/${id}`);

// Redis Subscriptions
export interface RedisSubscription {
  id: number;
  workflowId: number;
  configId: number;
  channel: string;
  isPattern: boolean;
  enabled: boolean;
  lastMsgAt?: string;
  msgCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getRedisSubscriptions = () => api.get<RedisSubscription[]>('/redis-subscriptions');
export const getRedisSubscription = (id: number) => api.get<RedisSubscription>(`/redis-subscriptions/${id}`);
export const createRedisSubscription = (data: Partial<RedisSubscription>) =>
  api.post<RedisSubscription>('/redis-subscriptions', data);
export const updateRedisSubscription = (id: number, data: Partial<RedisSubscription>) =>
  api.put<RedisSubscription>(`/redis-subscriptions/${id}`, data);
export const deleteRedisSubscription = (id: number) => api.delete(`/redis-subscriptions/${id}`);

// Email Triggers
export interface EmailTrigger {
  id: number;
  workflowId: number;
  configId: number;
  mailbox: string;
  pollIntervalSec: number;
  markSeen: boolean;
  maxFetch: number;
  enabled: boolean;
  lastPollAt?: string;
  msgCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getEmailTriggers = () => api.get<EmailTrigger[]>('/email-triggers');
export const getEmailTrigger = (id: number) => api.get<EmailTrigger>(`/email-triggers/${id}`);
export const createEmailTrigger = (data: Partial<EmailTrigger>) =>
  api.post<EmailTrigger>('/email-triggers', data);
export const updateEmailTrigger = (id: number, data: Partial<EmailTrigger>) =>
  api.put<EmailTrigger>(`/email-triggers/${id}`, data);
export const deleteEmailTrigger = (id: number) => api.delete(`/email-triggers/${id}`);

// HTTP Triggers (HTTP-in / HTTP-out like Node-RED)
export interface HttpTrigger {
  id: number;
  workflowId: number;
  path: string;
  method: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getHttpTriggers = () => api.get<HttpTrigger[]>('/http-triggers');
export const getHttpTrigger = (id: number) => api.get<HttpTrigger>(`/http-triggers/${id}`);
export const createHttpTrigger = (data: Partial<HttpTrigger>) =>
  api.post<HttpTrigger>('/http-triggers', data);
export const updateHttpTrigger = (id: number, data: Partial<HttpTrigger>) =>
  api.put<HttpTrigger>(`/http-triggers/${id}`, data);
export const deleteHttpTrigger = (id: number) => api.delete(`/http-triggers/${id}`);

// Config Store (key-value for secrets, tokens)
export interface ConfigStoreEntryMasked {
  key: string;
  value: string; // masked as ******** in list
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigStoreEntryFull {
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const getConfigStoreList = () =>
  api.get<ConfigStoreEntryMasked[]>('/config-store');
export const getConfigStoreEntry = (key: string) =>
  api.get<ConfigStoreEntryFull>(`/config-store/${encodeURIComponent(key)}`);
export const setConfigStoreEntry = (data: { key: string; value: string; description?: string }) =>
  api.post('/config-store', data);
export const updateConfigStoreEntry = (data: { key: string; value: string; description?: string }) =>
  api.put('/config-store', data);
export const deleteConfigStoreEntry = (key: string) =>
  api.delete(`/config-store/${encodeURIComponent(key)}`);

export default api;

