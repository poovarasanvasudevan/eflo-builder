import { useEffect, useState, useCallback, useRef } from 'react';
import { Typography, Tag, Empty, Card, Timeline, Descriptions, Tabs } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';

const { Text } = Typography;

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

/* ── Draggable vertical divider ── */
function VDivider({ onDrag, darkMode }: { onDrag: (delta: number) => void; darkMode?: boolean }) {
  const dragging = useRef(false);
  const lastX = useRef(0);
  const dividerBg = darkMode ? '#2e3138' : '#d8dde6';

  const onMouseDown = useCallback((e: React.MouseEvent) => {
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
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: 5,
        cursor: 'col-resize',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = dividerBg)}
      onMouseLeave={(e) => { if (!dragging.current) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ width: 1, height: '60%', background: dividerBg, borderRadius: 1 }} />
    </div>
  );
}

interface ExecutionHistoryProps {
  darkMode?: boolean;
}

export default function ExecutionHistory({ darkMode = false }: ExecutionHistoryProps) {
  const {
    currentWorkflow,
    executions,
    fetchExecutions,
    fetchExecutionLogs,
    executionLogs,
  } = useWorkflowStore();

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [execWidth, setExecWidth] = useState(EXEC_DEFAULT);
  const [detailWidth, setDetailWidth] = useState(DETAIL_DEFAULT);

  useEffect(() => {
    if (currentWorkflow) {
      fetchExecutions();
    }
  }, [currentWorkflow?.id]);

  useEffect(() => {
    setSelectedLog(null);
  }, [executionLogs]);

  const selectedExecId = executionLogs.length > 0 ? executionLogs[0]?.executionId : null;

  const onExecDrag = useCallback((dx: number) => {
    setExecWidth((w) => Math.min(EXEC_MAX, Math.max(EXEC_MIN, w + dx)));
  }, []);

  const onDetailDrag = useCallback((dx: number) => {
    // Dragging left = wider detail panel (negative dx)
    setDetailWidth((w) => Math.min(DETAIL_MAX, Math.max(DETAIL_MIN, w - dx)));
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <SyncOutlined spin style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#999' }} />;
    }
  };

  const statusColor = (status: string): string => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  if (!currentWorkflow) {
    return <div style={{ padding: 12 }}><Empty description="Select a workflow" image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>;
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
    <div style={{ padding: '4px 0 4px 12px', display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      {/* Executions list */}
      <div style={{ width: execWidth, flexShrink: 0, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <Text strong style={{ fontSize: 11, marginBottom: 4, display: 'block', color: textHeading }}>Executions</Text>
        {executions.length === 0 && <Empty description="No runs yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        {executions.map((exec) => (
          <Card
            key={exec.id}
            size="small"
            style={{
              marginBottom: 3,
              cursor: 'pointer',
              borderLeft: `3px solid ${exec.status === 'completed' ? '#52c41a' : exec.status === 'running' ? '#faad14' : '#ff4d4f'}`,
              background: selectedExecId === exec.id ? cardBgSelected : cardBg,
            }}
            styles={{ body: { padding: '4px 6px' } }}
            onClick={() => fetchExecutionLogs(exec.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 10 }}>#{exec.id}</Text>
              <Tag
                icon={statusIcon(exec.status)}
                color={statusColor(exec.status)}
                style={{ fontSize: 9, lineHeight: '14px', padding: '0 3px', margin: 0 }}
              >
                {exec.status}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 9 }}>
              {exec.startedAt ? new Date(exec.startedAt).toLocaleString() : 'N/A'}
            </Text>
          </Card>
        ))}
      </div>

      {/* Resizable divider: executions ↔ timeline */}
      <VDivider onDrag={onExecDrag} darkMode={darkMode} />

      {/* Execution timeline */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '0 8px' }}>
        {executionLogs.length === 0 ? (
          <Empty description="Click an execution to view logs" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <Text strong style={{ fontSize: 11, marginBottom: 4, display: 'block', color: textHeading }}>
              Timeline — Execution #{selectedExecId}
            </Text>
            <Timeline
              items={executionLogs.map((log) => ({
                color: log.status === 'success' ? 'green' : 'red',
                children: (
                  <div
                    style={{
                      fontSize: 10,
                      cursor: 'pointer',
                      padding: '3px 6px',
                      borderRadius: 4,
                      background: selectedLog?.id === log.id ? (darkMode ? '#252729' : '#e6f7ff') : 'transparent',
                      border: selectedLog?.id === log.id ? `1px solid ${darkMode ? '#3c3f47' : '#91d5ff'}` : '1px solid transparent',
                      transition: 'all 0.15s',
                    }}
                    onClick={() => setSelectedLog(log)}
                    onMouseEnter={(e) => {
                      if (selectedLog?.id !== log.id) {
                        e.currentTarget.style.background = darkMode ? '#252729' : '#f0f5ff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedLog?.id !== log.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag color="blue" style={{ fontSize: 9, padding: '0 3px', margin: 0 }}>{log.nodeType}</Tag>
                      <Text type="secondary" style={{ fontSize: 9 }}>{log.nodeId}</Text>
                      <Tag
                        color={statusColor(log.status)}
                        style={{ fontSize: 9, padding: '0 3px', margin: 0 }}
                      >
                        {log.status}
                      </Tag>
                      {selectedLog?.id === log.id && (
                        <RightOutlined style={{ fontSize: 8, color: '#1890ff', marginLeft: 'auto' }} />
                      )}
                    </div>
                    {log.error && <Text type="danger" style={{ fontSize: 9 }}>⚠ {log.error.substring(0, 50)}</Text>}
                    <Text type="secondary" style={{ fontSize: 8 }}>{new Date(log.executedAt).toLocaleTimeString()}</Text>
                  </div>
                ),
              }))}
            />
          </>
        )}
      </div>

      {/* Resizable divider: timeline ↔ detail (only when detail is open) */}
      {selectedLog && <VDivider onDrag={onDetailDrag} darkMode={darkMode} />}

      {/* Detail panel on the right */}
      {selectedLog && (
        <div
          style={{
            width: detailWidth,
            flexShrink: 0,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '4px 8px',
            background: detailBg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text strong style={{ fontSize: 11, color: textHeading }}>Node Detail</Text>
            <span
              onClick={() => setSelectedLog(null)}
              style={{ cursor: 'pointer', fontSize: 12, color: closeColor, lineHeight: 1 }}
            >✕</span>
          </div>

          <Descriptions
            size="small"
            column={1}
            bordered
            labelStyle={{ fontSize: 10, padding: '3px 6px', background: detailLabelBg, width: 70 }}
            contentStyle={{ fontSize: 10, padding: '3px 6px' }}
          >
            <Descriptions.Item label="Node">{selectedLog.nodeId}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="blue" style={{ fontSize: 9, padding: '0 3px', margin: 0 }}>{selectedLog.nodeType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                icon={statusIcon(selectedLog.status)}
                color={statusColor(selectedLog.status)}
                style={{ fontSize: 9, padding: '0 3px', margin: 0 }}
              >
                {selectedLog.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Time">{new Date(selectedLog.executedAt).toLocaleString()}</Descriptions.Item>
            {selectedLog.error && (
              <Descriptions.Item label="Error">
                <Text type="danger" style={{ fontSize: 10, wordBreak: 'break-all' }}>{selectedLog.error}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Tabs
            size="small"
            defaultActiveKey="output"
            style={{ marginTop: 6 }}
            items={[
              ...(selectedLog.input && selectedLog.input !== '{}' && selectedLog.input !== 'null'
                ? [{
                    key: 'input',
                    label: <span style={{ fontSize: 10 }}>Input</span>,
                    children: (
                      <pre style={{
                        margin: 0,
                        fontSize: 10,
                        maxHeight: 200,
                        overflow: 'auto',
                        background: preBg,
                        padding: 6,
                        borderRadius: 4,
                        border: `1px solid ${preBorder}`,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: darkMode ? '#c3cbd8' : undefined,
                      }}>
                        {formatJSON(selectedLog.input)}
                      </pre>
                    ),
                  }]
                : []),
              ...(selectedLog.output && selectedLog.output !== '{}' && selectedLog.output !== 'null'
                ? [{
                    key: 'output',
                    label: <span style={{ fontSize: 10 }}>Output</span>,
                    children: (
                      <pre style={{
                        margin: 0,
                        fontSize: 10,
                        maxHeight: 200,
                        overflow: 'auto',
                        background: preBg,
                        padding: 6,
                        borderRadius: 4,
                        border: `1px solid ${preBorder}`,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        color: darkMode ? '#c3cbd8' : undefined,
                      }}>
                        {formatJSON(selectedLog.output)}
                      </pre>
                    ),
                  }]
                : []),
            ]}
          />
        </div>
      )}
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
