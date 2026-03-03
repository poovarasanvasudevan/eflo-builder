import { useEffect, useState, useCallback, useRef } from 'react';
import Tabs, { TabList, Tab, TabPanel } from '@atlaskit/tabs';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import { Text } from './ui/Text';

interface LogEntry {
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

const EXEC_MIN = 120;
const EXEC_MAX = 400;
const EXEC_DEFAULT = 200;
const DETAIL_MIN = 200;
const DETAIL_MAX = 600;
const DETAIL_DEFAULT = 320;

function VDivider({ onDrag, darkMode }: { onDrag: (delta: number) => void; darkMode?: boolean }) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const dividerBg = darkMode ? '#2e3138' : '#d8dde6';

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      lastX.current = e.clientX;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const dx = ev.clientX - lastX.current;
        lastX.current = ev.clientX;
        onDrag(dx);
      };
      const onUp = () => {
        dragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [onDrag]
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-[5px] cursor-col-resize flex-shrink-0 flex items-center justify-center z-[5]"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = dividerBg)}
      onMouseLeave={(e) => {
        if (!dragging.current) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div className="w-px h-[60%] rounded-sm" style={{ background: dividerBg }} />
    </div>
  );
}

function formatJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

interface ExecutionHistoryProps {
  darkMode?: boolean;
}

export default function ExecutionHistory({ darkMode = false }: ExecutionHistoryProps) {
  const { currentWorkflow, executions, fetchExecutions, fetchExecutionLogs, executionLogs } = useWorkflowStore();
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [execWidth, setExecWidth] = useState(EXEC_DEFAULT);
  const [detailWidth, setDetailWidth] = useState(DETAIL_DEFAULT);

  useEffect(() => {
    if (currentWorkflow) fetchExecutions();
  }, [currentWorkflow?.id, fetchExecutions]);

  useEffect(() => {
    setSelectedLog(null);
  }, [executionLogs]);

  const selectedExecId = executionLogs.length > 0 ? executionLogs[0]?.executionId : null;

  const onExecDrag = useCallback((dx: number) => {
    setExecWidth((w) => Math.min(EXEC_MAX, Math.max(EXEC_MIN, w + dx)));
  }, []);

  const onDetailDrag = useCallback((dx: number) => {
    setDetailWidth((w) => Math.min(DETAIL_MAX, Math.max(DETAIL_MIN, w - dx)));
  }, []);

  const statusColor = (status: string): 'success' | 'removed' | 'inprogress' | 'default' => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'removed';
      case 'running':
        return 'inprogress';
      default:
        return 'default';
    }
  };

  if (!currentWorkflow) {
    return <div className="p-3 text-center text-sm text-[#706e6b]">Select a workflow</div>;
  }

  const textHeading = darkMode ? '#e2e8f0' : '#16325c';
  const cardBg = darkMode ? '#2b2d33' : '#fff';
  const cardBgSelected = darkMode ? '#252729' : '#e6f7ff';
  const detailBg = darkMode ? '#2b2d33' : '#fafafa';
  const detailLabelBg = darkMode ? '#252729' : '#f5f5f5';
  const preBg = darkMode ? '#14161a' : '#fff';
  const preBorder = darkMode ? '#2e3138' : '#e8e8e8';
  const closeColor = darkMode ? '#8b95a5' : '#706e6b';

  return (
    <div className="py-1 pl-3 flex h-full min-h-0 overflow-hidden">
      <div className="flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden" style={{ width: execWidth }}>
        <Text strong className="text-[11px] mb-1 block" style={{ color: textHeading }}>Executions</Text>
        {executions.length === 0 && <div className="text-sm text-[#706e6b] py-4 text-center">No runs yet</div>}
        {executions.map((exec) => (
          <div
            key={exec.id}
            className="mb-0.5 cursor-pointer p-1 rounded border-l-[3px] transition-colors"
            style={{
              background: selectedExecId === exec.id ? cardBgSelected : cardBg,
              borderLeftColor: exec.status === 'completed' ? '#52c41a' : exec.status === 'running' ? '#faad14' : '#ff4d4f',
            }}
            onClick={() => fetchExecutionLogs(exec.id)}
          >
            <div className="flex justify-between items-center">
              <Text strong className="text-[10px]">#{exec.id}</Text>
              <span className="text-[9px]"><Lozenge appearance={statusColor(exec.status)}>{exec.status}</Lozenge></span>
            </div>
            <Text className="text-[9px] text-[#706e6b]">{exec.startedAt ? new Date(exec.startedAt).toLocaleString() : 'N/A'}</Text>
          </div>
        ))}
      </div>

      <VDivider onDrag={onExecDrag} darkMode={darkMode} />

      <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden px-2">
        {executionLogs.length === 0 ? (
          <div className="text-sm text-[#706e6b] py-4 text-center">Click an execution to view logs</div>
        ) : (
          <>
            <Text strong className="text-[11px] mb-1 block" style={{ color: textHeading }}>Timeline — Execution #{selectedExecId}</Text>
            <ul className="list-none m-0 p-0 space-y-0.5">
              {executionLogs.map((log) => (
                <li
                  key={log.id}
                  className="text-[10px] cursor-pointer py-1 px-1.5 rounded transition-all"
                  style={{
                    background: selectedLog?.id === log.id ? (darkMode ? '#252729' : '#e6f7ff') : 'transparent',
                    border: selectedLog?.id === log.id ? `1px solid ${darkMode ? '#3c3f47' : '#91d5ff'}` : '1px solid transparent',
                  }}
                  onClick={() => setSelectedLog(log)}
                  onMouseEnter={(e) => {
                    if (selectedLog?.id !== log.id) e.currentTarget.style.background = darkMode ? '#252729' : '#f0f5ff';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLog?.id !== log.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]"><Lozenge appearance="inprogress">{log.nodeType}</Lozenge></span>
                    <span className="text-[9px] text-[#706e6b]">{log.nodeId}</span>
                    <span className="text-[9px]"><Lozenge appearance={statusColor(log.status)}>{log.status}</Lozenge></span>
                  </div>
                  {log.error && <div className="text-red-600 text-[9px]">⚠ {log.error.substring(0, 50)}</div>}
                  <div className="text-[8px] text-[#706e6b]">{new Date(log.executedAt).toLocaleTimeString()}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {selectedLog && <VDivider onDrag={onDetailDrag} darkMode={darkMode} />}

      {selectedLog && (
        <div className="flex-shrink-0 min-h-0 overflow-y-auto overflow-x-hidden py-1 px-2" style={{ width: detailWidth, background: detailBg }}>
          <div className="flex justify-between items-center mb-1.5">
            <Text strong className="text-[11px]" style={{ color: textHeading }}>Node Detail</Text>
            <button type="button" onClick={() => setSelectedLog(null)} className="cursor-pointer text-xs leading-none" style={{ color: closeColor }}>✕</button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] border border-[#e8e8e8] rounded p-1">
            <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Node</dt>
            <dd className="py-0.5 px-1.5 m-0">{selectedLog.nodeId}</dd>
            <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Type</dt>
            <dd className="py-0.5 px-1.5 m-0 text-[9px]"><Lozenge appearance="inprogress">{selectedLog.nodeType}</Lozenge></dd>
            <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Status</dt>
            <dd className="py-0.5 px-1.5 m-0 text-[9px]"><Lozenge appearance={statusColor(selectedLog.status)}>{selectedLog.status}</Lozenge></dd>
            <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Time</dt>
            <dd className="py-0.5 px-1.5 m-0">{new Date(selectedLog.executedAt).toLocaleString()}</dd>
            {selectedLog.error && (
              <>
                <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Error</dt>
                <dd className="py-0.5 px-1.5 m-0 text-red-600 break-all">{selectedLog.error}</dd>
              </>
            )}
          </dl>
          <div className="mt-2">
            <Tabs id="exec-detail-tabs" selected={tabIndex} onChange={(idx: number) => setTabIndex(idx)}>
              <TabList>
                <Tab>Input</Tab>
                <Tab>Output</Tab>
              </TabList>
              <TabPanel>
                <pre className="m-0 text-[10px] max-h-[200px] overflow-auto p-1.5 rounded border whitespace-pre-wrap break-all" style={{ background: preBg, borderColor: preBorder, color: darkMode ? '#c3cbd8' : undefined }}>
                  {selectedLog.input && selectedLog.input !== '{}' && selectedLog.input !== 'null' ? formatJSON(selectedLog.input) : '(empty)'}
                </pre>
              </TabPanel>
              <TabPanel>
                <pre className="m-0 text-[10px] max-h-[200px] overflow-auto p-1.5 rounded border whitespace-pre-wrap break-all" style={{ background: preBg, borderColor: preBorder, color: darkMode ? '#c3cbd8' : undefined }}>
                  {selectedLog.output && selectedLog.output !== '{}' && selectedLog.output !== 'null' ? formatJSON(selectedLog.output) : '(empty)'}
                </pre>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}
