import { useEffect, useState, useRef, useCallback } from 'react';
import Button from '@atlaskit/button';
import Spinner from '@atlaskit/spinner';
import Lozenge from '@atlaskit/lozenge';
import { useWorkflowStore } from '../store/workflowStore';
import { executeWorkflowDebug, type DebugEvent } from '../api/client';
import { Text } from './ui/Text';
import { Icons } from './ui/Icons';

const DETAIL_MIN = 200;
const DETAIL_MAX = 500;
const DETAIL_DEFAULT = 280;

function VDivider({ onDrag, darkMode }: { onDrag: (delta: number) => void; darkMode?: boolean }) {
  const dragging = useRef(false);
  const dividerBg = darkMode ? '#2e3138' : '#d8dde6';

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [onDrag]
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-[5px] cursor-col-resize flex-shrink-0 flex items-center justify-center z-[5] hover:opacity-80"
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
  const { currentWorkflow, debugRunTrigger, setDebugRunTrigger, saveWorkflow, fetchExecutions } = useWorkflowStore();
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
  }, [currentWorkflow, debugRunTrigger, setDebugRunTrigger, saveWorkflow, fetchExecutions, scrollToBottom]);

  const statusColor = (status: string): 'success' | 'removed' | 'inprogress' | 'moved' | 'default' => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'failed':
      case 'error':
        return 'removed';
      default:
        return 'inprogress';
    }
  };

  const handleRunAgain = () => {
    if (!currentWorkflow) return;
    setDebugRunTrigger(currentWorkflow.id);
  };

  if (!currentWorkflow) {
    return (
      <div className="p-3 text-center text-sm text-[#706e6b]">Select a workflow</div>
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

  const timelineItems: { ev: DebugEvent; label: string }[] = [];
  if (startedEvent) timelineItems.push({ ev: startedEvent, label: 'Started' });
  nodeEvents.forEach((ev) => timelineItems.push({ ev, label: ev.nodeType || ev.nodeId || '' }));
  if (finishedEvent) timelineItems.push({ ev: finishedEvent, label: finishedEvent.status ?? '' });

  return (
    <div className="p-2 px-3 h-full min-h-0 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <Text strong className="text-xs flex items-center gap-1" style={{ color: textHeading }}>
          <Icons.Bug /> Debug — Live timeline
          {startedEvent && (
            <span className="ml-2"><Lozenge appearance="inprogress">Execution #{startedEvent.executionId ?? ''}</Lozenge></span>
          )}
          {running && <span className="ml-2 inline-block"><Spinner size="small" /></span>}
        </Text>
        <Button appearance="primary" onClick={handleRunAgain} isDisabled={running}>
          <span className="flex items-center gap-1"><Icons.Play /> Run again</span>
        </Button>
      </div>

      {error && (
        <div className="mb-2 p-1.5 rounded flex-shrink-0 text-red-600 text-sm" style={{ background: errorBg }}>
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden">
          {events.length === 0 && !running && !error && (
            <div className="mt-6 text-center text-sm text-[#706e6b]">Click Debug in the toolbar to run and stream events</div>
          )}
          {events.length > 0 && (
            <ul className="list-none m-0 p-0 border-l-2 border-[#dfe1e6] pl-4 space-y-1">
              {startedEvent && (
                <li className="text-[10px] py-1">
                  <Lozenge appearance="inprogress">Started</Lozenge>
                  <span className="text-[9px] text-[#706e6b] ml-1">{new Date(startedEvent.executedAt).toLocaleTimeString()}</span>
                </li>
              )}
              {nodeEvents.map((ev) => (
                <li
                  key={`${ev.executedAt}-${ev.nodeId}`}
                  className="text-[10px] cursor-pointer py-1.5 px-2 rounded transition-all"
                  style={{
                    background: selectedEvent?.executedAt === ev.executedAt ? timelineSelectedBg : 'transparent',
                    border: selectedEvent?.executedAt === ev.executedAt ? `1px solid ${timelineSelectedBorder}` : '1px solid transparent',
                  }}
                  onClick={() => setSelectedEvent(ev)}
                  onMouseEnter={(e) => {
                    if (selectedEvent?.executedAt !== ev.executedAt) e.currentTarget.style.background = timelineHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEvent?.executedAt !== ev.executedAt) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px]"><Lozenge appearance="inprogress">{ev.nodeType || ev.nodeId}</Lozenge></span>
                    {ev.nodeLabel && ev.nodeLabel !== ev.nodeId && <span className="text-[9px] text-[#706e6b]">{ev.nodeLabel}</span>}
                    <span className="text-[9px]"><Lozenge appearance={statusColor(ev.status)}>{ev.status}</Lozenge></span>
                  </div>
                  {ev.error && <div className="text-red-600 text-[9px] mt-0.5">⚠ {ev.error}</div>}
                  <div className="text-[8px] text-[#706e6b]">{new Date(ev.executedAt).toLocaleTimeString()}</div>
                </li>
              ))}
              {finishedEvent && (
                <li className="text-[10px] py-1">
                  <Lozenge appearance={statusColor(finishedEvent.status)}>{finishedEvent.status}</Lozenge>
                  {finishedEvent.error && <span className="text-red-600 text-[9px] ml-1">{finishedEvent.error}</span>}
                  <span className="text-[9px] text-[#706e6b] ml-1">{new Date(finishedEvent.executedAt).toLocaleTimeString()}</span>
                </li>
              )}
            </ul>
          )}
          <div ref={timelineEndRef} />
        </div>

        <VDivider onDrag={onDetailDrag} darkMode={darkMode} />

        <div
          className="flex-shrink-0 min-h-0 pl-2 overflow-y-auto overflow-x-hidden rounded border-l"
          style={{ width: detailWidth, borderColor: detailBorder, background: detailBg }}
        >
          {selectedEvent && selectedEvent.event === 'node' ? (
            <>
              <div className="flex justify-between items-center mb-1.5">
                <Text strong className="text-[11px]" style={{ color: textHeading }}>Node detail</Text>
                <button type="button" onClick={() => setSelectedEvent(null)} className="cursor-pointer text-xs leading-none" style={{ color: closeColor }}>
                  ✕
                </button>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[10px] border border-[#e8e8e8] rounded">
                <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Node</dt>
                <dd className="py-0.5 px-1.5 m-0">{selectedEvent.nodeId}</dd>
                <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Type</dt>
                <dd className="py-0.5 px-1.5 m-0 text-[9px]"><Lozenge appearance="inprogress">{selectedEvent.nodeType}</Lozenge></dd>
                <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Status</dt>
                <dd className="py-0.5 px-1.5 m-0 text-[9px]"><Lozenge appearance={statusColor(selectedEvent.status)}>{selectedEvent.status}</Lozenge></dd>
                <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Time</dt>
                <dd className="py-0.5 px-1.5 m-0">{new Date(selectedEvent.executedAt).toLocaleString()}</dd>
                {selectedEvent.error && (
                  <>
                    <dt className="py-0.5 px-1.5 font-medium" style={{ background: detailLabelBg }}>Error</dt>
                    <dd className="py-0.5 px-1.5 m-0 text-red-600 break-all">{selectedEvent.error}</dd>
                  </>
                )}
              </dl>
              <div className="mt-2">
                <Text strong className="text-[10px] block mb-1">Input</Text>
                <pre className="m-0 text-[10px] max-h-[180px] overflow-auto p-1.5 rounded border whitespace-pre-wrap break-all" style={{ background: preBg, borderColor: preBorder, color: darkMode ? '#c3cbd8' : undefined }}>
                  {formatJSON(selectedEvent.input || '') || '(empty)'}
                </pre>
              </div>
              <div className="mt-2">
                <Text strong className="text-[10px] block mb-1">Output</Text>
                <pre className="m-0 text-[10px] max-h-[180px] overflow-auto p-1.5 rounded border whitespace-pre-wrap break-all" style={{ background: preBg, borderColor: preBorder, color: darkMode ? '#c3cbd8' : undefined }}>
                  {formatJSON(selectedEvent.output || '') || '(empty)'}
                </pre>
              </div>
            </>
          ) : (
            <div className="py-6 px-2 text-center">
              <Text className="text-[11px] text-[#706e6b]">Click a timeline node to view its input and output here.</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
