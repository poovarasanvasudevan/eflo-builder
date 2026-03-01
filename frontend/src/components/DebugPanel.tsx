import { useEffect, useState, useRef, useCallback } from 'react';
import { Typography, Tag, Empty, Timeline, Spin, Button, Descriptions } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  RightOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useWorkflowStore } from '../store/workflowStore';
import { executeWorkflowDebug, type DebugEvent } from '../api/client';

const { Text } = Typography;

const DETAIL_MIN = 200;
const DETAIL_MAX = 500;
const DETAIL_DEFAULT = 280;

/* Draggable vertical divider between timeline and detail panel */
function VDivider({ onDrag, darkMode }: { onDrag: (delta: number) => void; darkMode?: boolean }) {
  const dragging = useRef(false);
  const dividerBg = darkMode ? '#2e3138' : '#d8dde6';

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      onDrag(ev.movementX);
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

function formatJSON(str: string): string {
  if (!str || str === '{}' || str === 'null') return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

interface DebugPanelProps {
  darkMode?: boolean;
}

export default function DebugPanel({ darkMode = false }: DebugPanelProps) {
  const {
    currentWorkflow,
    debugRunTrigger,
    setDebugRunTrigger,
    saveWorkflow,
    fetchExecutions,
  } = useWorkflowStore();

  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DebugEvent | null>(null);
  const [detailWidth, setDetailWidth] = useState(DETAIL_DEFAULT);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const runRequestedRef = useRef(false);

  const onDetailDrag = useCallback((dx: number) => {
    setDetailWidth((w) => Math.min(DETAIL_MAX, Math.max(DETAIL_MIN, w + dx)));
  }, []);

  const scrollToBottom = useCallback(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!currentWorkflow || !debugRunTrigger || debugRunTrigger !== currentWorkflow.id) return;
    if (runRequestedRef.current) return;
    runRequestedRef.current = true;
    setDebugRunTrigger(null);

    const run = async () => {
      setEvents([]);
      setError(null);
      setSelectedEvent(null);
      setRunning(true);
      await saveWorkflow();

      await executeWorkflowDebug(
        currentWorkflow.id,
        (ev) => {
          setEvents((prev) => [...prev, ev]);
          setTimeout(scrollToBottom, 0);
        },
        () => {
          setRunning(false);
          runRequestedRef.current = false;
          fetchExecutions();
        },
        (err) => {
          setError(err);
          setRunning(false);
          runRequestedRef.current = false;
        }
      );
    };

    run();
  }, [currentWorkflow, debugRunTrigger, setDebugRunTrigger, saveWorkflow, scrollToBottom]);

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
        return null;
    }
  };

  const handleRunAgain = () => {
    if (!currentWorkflow) return;
    setDebugRunTrigger(currentWorkflow.id);
  };

  if (!currentWorkflow) {
    return (
      <div style={{ padding: 12 }}>
        <Empty description="Select a workflow" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const nodeEvents = events.filter((e) => e.event === 'node');
  const startedEvent = events.find((e) => e.event === 'started');
  const finishedEvent = events.find((e) => e.event === 'finished');

  const textHeading = darkMode ? '#e2e8f0' : '#16325c';
  const errorBg = darkMode ? '#2d1f1f' : '#fff2f0';
  const timelineSelectedBg = darkMode ? '#252729' : '#e6f7ff';
  const timelineSelectedBorder = darkMode ? '#3c3f47' : '#91d5ff';
  const timelineHoverBg = darkMode ? '#252729' : '#f0f5ff';
  const detailBg = darkMode ? '#2b2d33' : '#fafafa';
  const detailBorder = darkMode ? '#2e3138' : '#e8e8e8';
  const detailLabelBg = darkMode ? '#252729' : '#f5f5f5';
  const preBg = darkMode ? '#14161a' : '#fff';
  const preBorder = darkMode ? '#2e3138' : '#e8e8e8';
  const closeColor = darkMode ? '#8b95a5' : '#706e6b';

  return (
    <div style={{ padding: '8px 12px', height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
        <Text strong style={{ fontSize: 12, color: textHeading }}>
          <BugOutlined style={{ marginRight: 4 }} />
          Debug — Live timeline
          {startedEvent && (
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
              Execution #{startedEvent.executionId}
            </Tag>
          )}
          {running && <Spin size="small" style={{ marginLeft: 8 }} />}
        </Text>
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={handleRunAgain}
          disabled={running}
        >
          Run again
        </Button>
      </div>

      {error && (
        <div style={{ marginBottom: 8, padding: 6, background: errorBg, borderRadius: 4, flexShrink: 0 }}>
          <Text type="danger">{error}</Text>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Timeline */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {events.length === 0 && !running && !error && (
            <Empty
              description="Click Debug in the toolbar to run and stream events"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 24 }}
            />
          )}
          {events.length > 0 && (
            <Timeline
              key={events.length}
              items={[
                startedEvent && {
                  color: 'blue',
                  children: (
                    <div style={{ fontSize: 10, padding: '4px 0' }}>
                      <Tag color="blue">Started</Tag>
                      <Text type="secondary" style={{ fontSize: 9, marginLeft: 4 }}>
                        {new Date(startedEvent.executedAt).toLocaleTimeString()}
                      </Text>
                    </div>
                  ),
                },
                ...nodeEvents.map((ev) => ({
                  color: ev.status === 'success' ? 'green' : 'red',
                  children: (
                    <div
                      style={{
                        fontSize: 10,
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: 4,
                        background: selectedEvent?.executedAt === ev.executedAt ? timelineSelectedBg : 'transparent',
                        border: selectedEvent?.executedAt === ev.executedAt ? `1px solid ${timelineSelectedBorder}` : '1px solid transparent',
                        transition: 'all 0.15s',
                      }}
                      onClick={() => setSelectedEvent(ev)}
                      onMouseEnter={(e) => {
                        if (selectedEvent?.executedAt !== ev.executedAt) e.currentTarget.style.background = timelineHoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if (selectedEvent?.executedAt !== ev.executedAt) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <Tag color="blue" style={{ fontSize: 9, padding: '0 3px', margin: 0 }}>
                          {ev.nodeType || ev.nodeId}
                        </Tag>
                        {ev.nodeLabel && ev.nodeLabel !== ev.nodeId && (
                          <Text type="secondary" style={{ fontSize: 9 }}>{ev.nodeLabel}</Text>
                        )}
                        <Tag
                          color={statusColor(ev.status)}
                          style={{ fontSize: 9, padding: '0 3px', margin: 0 }}
                          icon={statusIcon(ev.status)}
                        >
                          {ev.status}
                        </Tag>
                        {selectedEvent?.executedAt === ev.executedAt && (
                          <RightOutlined style={{ fontSize: 8, color: '#1890ff', marginLeft: 'auto' }} />
                        )}
                      </div>
                      {ev.error && (
                        <Text type="danger" style={{ fontSize: 9, display: 'block', marginTop: 2 }}>
                          ⚠ {ev.error}
                        </Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 8 }}>
                        {new Date(ev.executedAt).toLocaleTimeString()}
                      </Text>
                    </div>
                  ),
                })),
                finishedEvent && {
                  color: finishedEvent.status === 'completed' ? 'green' : 'red',
                  children: (
                    <div style={{ fontSize: 10, padding: '4px 0' }}>
                      <Tag color={statusColor(finishedEvent.status)} icon={statusIcon(finishedEvent.status)}>
                        {finishedEvent.status}
                      </Tag>
                      {finishedEvent.error && (
                        <Text type="danger" style={{ fontSize: 9, marginLeft: 4 }}>{finishedEvent.error}</Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 9, marginLeft: 4 }}>
                        {new Date(finishedEvent.executedAt).toLocaleTimeString()}
                      </Text>
                    </div>
                  ),
                },
              ].filter(Boolean) as { color: string; children: React.ReactNode }[]}
            />
          )}
          <div ref={timelineEndRef} />
        </div>

        <VDivider onDrag={onDetailDrag} darkMode={darkMode} />

        {/* Right: Node input/output detail */}
        <div
          style={{
            width: detailWidth,
            flexShrink: 0,
            minHeight: 0,
            borderLeft: `1px solid ${detailBorder}`,
            paddingLeft: 8,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: detailBg,
            borderRadius: 4,
          }}
        >
          {selectedEvent && selectedEvent.event === 'node' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text strong style={{ fontSize: 11, color: textHeading }}>Node detail</Text>
                <span
                  onClick={() => setSelectedEvent(null)}
                  style={{ cursor: 'pointer', fontSize: 12, color: closeColor, lineHeight: 1 }}
                >
                  ✕
                </span>
              </div>
              <Descriptions
                size="small"
                column={1}
                bordered
                labelStyle={{ fontSize: 10, padding: '3px 6px', background: detailLabelBg, width: 56 }}
                contentStyle={{ fontSize: 10, padding: '3px 6px' }}
              >
                <Descriptions.Item label="Node">{selectedEvent.nodeId}</Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color="blue" style={{ fontSize: 9, padding: '0 3px', margin: 0 }}>{selectedEvent.nodeType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag
                    icon={statusIcon(selectedEvent.status)}
                    color={statusColor(selectedEvent.status)}
                    style={{ fontSize: 9, padding: '0 3px', margin: 0 }}
                  >
                    {selectedEvent.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Time">{new Date(selectedEvent.executedAt).toLocaleString()}</Descriptions.Item>
                {selectedEvent.error && (
                  <Descriptions.Item label="Error">
                    <Text type="danger" style={{ fontSize: 10, wordBreak: 'break-all' }}>{selectedEvent.error}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>Input</Text>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 10,
                    maxHeight: 180,
                    overflow: 'auto',
                    background: preBg,
                    padding: 6,
                    borderRadius: 4,
                    border: `1px solid ${preBorder}`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: darkMode ? '#c3cbd8' : undefined,
                  }}
                >
                  {formatJSON(selectedEvent.input || '') || '(empty)'}
                </pre>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 10, display: 'block', marginBottom: 4 }}>Output</Text>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 10,
                    maxHeight: 180,
                    overflow: 'auto',
                    background: preBg,
                    padding: 6,
                    borderRadius: 4,
                    border: `1px solid ${preBorder}`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: darkMode ? '#c3cbd8' : undefined,
                  }}
                >
                  {formatJSON(selectedEvent.output || '') || '(empty)'}
                </pre>
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 8px', textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Click a timeline node to view its input and output here.
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
