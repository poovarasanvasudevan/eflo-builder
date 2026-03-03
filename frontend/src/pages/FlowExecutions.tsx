import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useWorkflowStore } from '../store/workflowStore';
import { getWorkflow, getExecution, getExecutionLogs } from '../api/client';
import type { Execution, Workflow, ExecutionLog } from '../api/client';
import PageLayout from '../components/PageLayout';
import Button from '@atlaskit/button';
import Drawer from '@atlaskit/drawer';
import Lozenge from '@atlaskit/lozenge';
import Spinner from '@atlaskit/spinner';
import { Text } from '../components/ui/Text';

function formatDuration(sec: number): string {
  if (sec < 1) return `${(sec * 1000).toFixed(0)}ms`;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

function statusAppearance(status: string): 'success' | 'removed' | 'inprogress' | 'default' {
  switch (status) {
    case 'completed': return 'success';
    case 'running': return 'inprogress';
    case 'failed': return 'removed';
    default: return 'default';
  }
}

function formatJson(str: string | undefined): string {
  if (!str || str === '{}' || str === 'null') return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function LogItem({ log }: { log: ExecutionLog }) {
  const [open, setOpen] = useState<string | null>(null);
  const hasInput = log.input != null && log.input !== '';
  const hasOutput = log.output != null && log.output !== '';
  const hasError = log.error != null && log.error !== '';
  return (
    <div className="border-l-2 border-[#dfe1e6] pl-3 py-1 mb-2">
      <div className="flex items-center gap-2 flex-wrap mb-0.5">
        <Text strong className="text-xs">{log.nodeType}</Text>
        <Lozenge appearance="inprogress">{log.nodeId}</Lozenge>
        <Lozenge appearance={statusAppearance(log.status)}>{log.status}</Lozenge>
      </div>
      <div className="text-[10px] text-[#706e6b] mb-1">{new Date(log.executedAt).toLocaleString()}</div>
      {(hasInput || hasOutput || hasError) && (
        <div className="space-y-1">
          {hasInput && (
            <div>
              <button type="button" className="text-[10px] font-medium text-[#16325c]" onClick={() => setOpen((o) => o === 'input' ? null : 'input')}>Input</button>
              {open === 'input' && <pre className="m-0 mt-0.5 text-[10px] overflow-auto max-h-40 bg-[#f5f5f5] p-2 rounded">{formatJson(log.input)}</pre>}
            </div>
          )}
          {hasOutput && (
            <div>
              <button type="button" className="text-[10px] font-medium text-[#16325c]" onClick={() => setOpen((o) => o === 'output' ? null : 'output')}>Output</button>
              {open === 'output' && <pre className="m-0 mt-0.5 text-[10px] overflow-auto max-h-40 bg-[#f5f5f5] p-2 rounded">{formatJson(log.output)}</pre>}
            </div>
          )}
          {hasError && (
            <div>
              <button type="button" className="text-[10px] font-medium text-red-600" onClick={() => setOpen((o) => o === 'error' ? null : 'error')}>Error</button>
              {open === 'error' && <pre className="m-0 mt-0.5 text-[10px] text-red-600 overflow-auto max-h-40 bg-red-50 p-2 rounded">{log.error}</pre>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FlowExecutions() {
  const { flowId } = useParams<{ flowId: string }>();
  const navigate = useNavigate();
  const { fetchExecutionsForFlow } = useWorkflowStore();
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    if (!flowId) return;
    setLoading(true);
    Promise.all([
      fetchExecutionsForFlow(flowId),
      getWorkflow(Number(flowId)).then((r) => r.data).catch(() => null),
    ])
      .then(([execs, wf]) => {
        setExecutions(execs);
        setWorkflow(wf || null);
      })
      .finally(() => setLoading(false));
  }, [flowId, fetchExecutionsForFlow]);

  const openDetails = useCallback((record: Execution) => {
    setSelectedExecution(record);
    setDrawerOpen(true);
    setExecutionLogs([]);
    setDrawerLoading(true);
    Promise.all([
      getExecution(record.id).then((r) => r.data),
      getExecutionLogs(record.id).then((r) => r.data),
    ])
      .then(([exec, logs]) => {
        setSelectedExecution(exec);
        setExecutionLogs(logs);
      })
      .finally(() => setDrawerLoading(false));
  }, []);

  return (
    <PageLayout>
      <nav className="mb-3 text-[11px] flex items-center gap-1 text-[#706e6b]">
        <Link to="/flows" className="text-[#0052CC] hover:underline">Flows</Link>
        <span>/</span>
        <span>{workflow ? workflow.name : `Flow ${flowId}`}</span>
        <span>/</span>
        <span>Executions</span>
      </nav>
      <div className="mb-2 flex items-center gap-2">
        <Text strong className="text-xs">
          {workflow ? `Executions for "${workflow.name}"` : 'Executions'}
        </Text>
        <Button appearance="primary" onClick={() => navigate('/flows')}>Back to Flows</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="medium" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e8e8e8]">
                <th className="text-left py-2 px-2 font-semibold" style={{ width: 80 }}>ID</th>
                <th className="text-left py-2 px-2 font-semibold" style={{ width: 140 }}>Status</th>
                <th className="text-left py-2 px-2 font-semibold" style={{ width: 180 }}>Started</th>
                <th className="text-left py-2 px-2 font-semibold" style={{ width: 180 }}>Finished</th>
                <th className="text-left py-2 px-2 font-semibold" style={{ width: 180 }}>Time taken</th>
                <th className="text-left py-2 px-2 font-semibold" style={{ width: 90 }}>Details</th>
                <th className="text-left py-2 px-2 font-semibold">Error</th>
              </tr>
            </thead>
            <tbody>
              {executions.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-[#706e6b]">No executions for this flow yet.</td></tr>
              )}
              {executions.map((r) => {
                const started = r.startedAt ? new Date(r.startedAt).getTime() : null;
                const finished = r.finishedAt ? new Date(r.finishedAt).getTime() : null;
                const duration = started != null && finished != null && finished >= started ? formatDuration((finished - started) / 1000) : '—';
                return (
                  <tr key={r.id} className="border-b border-[#f0f0f0] hover:bg-black/[0.02]">
                    <td className="py-2 px-2 text-[11px]">{r.id}</td>
                    <td className="py-2 px-2"><Lozenge appearance={statusAppearance(r.status)}>{r.status}</Lozenge></td>
                    <td className="py-2 px-2 text-[11px]">{r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}</td>
                    <td className="py-2 px-2 text-[11px]">{r.finishedAt ? new Date(r.finishedAt).toLocaleString() : '—'}</td>
                    <td className="py-2 px-2 text-[11px]">{duration}</td>
                    <td className="py-2 px-2">
                      <button type="button" className="text-[11px] text-[#0052CC] hover:underline p-0" onClick={() => openDetails(r)}>View</button>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-red-600 max-w-[200px] truncate">{r.error || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Drawer onClose={() => setDrawerOpen(false)} isOpen={drawerOpen} label={selectedExecution ? `Execution #${selectedExecution.id}` : 'Execution details'}>
        {drawerLoading ? (
          <div className="flex justify-center py-6"><Spinner size="medium" /></div>
        ) : selectedExecution ? (
          <>
            <h2 className="text-base font-semibold mb-4">{selectedExecution ? `Execution #${selectedExecution.id}` : 'Execution details'}</h2>
            <div className="mb-4">
              <Lozenge appearance={statusAppearance(selectedExecution.status)}>{selectedExecution.status}</Lozenge>
              {selectedExecution.startedAt && (
                <Text className="text-[11px] text-[#706e6b] block mt-1">Started: {new Date(selectedExecution.startedAt).toLocaleString()}</Text>
              )}
              {selectedExecution.finishedAt && (
                <Text className="text-[11px] text-[#706e6b] block">Finished: {new Date(selectedExecution.finishedAt).toLocaleString()}</Text>
              )}
              {selectedExecution.error && (
                <Text className="text-[11px] text-red-600 block mt-1">{selectedExecution.error}</Text>
              )}
            </div>
            <Text strong className="text-xs block mb-2">Timeline</Text>
            {executionLogs.length === 0 ? (
              <Text className="text-[11px] text-[#706e6b]">No step logs for this execution.</Text>
            ) : (
              executionLogs.map((log) => <LogItem key={log.id} log={log} />)
            )}
          </>
        ) : null}
      </Drawer>
    </PageLayout>
  );
}
