import { useEffect, useState, useCallback, useRef } from 'react';
import Tabs, { TabList, Tab, TabPanel } from '@atlaskit/tabs';
import { ReactFlowProvider } from '@xyflow/react';
import { useWorkflowStore, restoreTabsOnStartup } from './store/workflowStore';
import Toolbar from './components/Toolbar';
import NodePalette from './components/NodePalette';
import Canvas from './components/Canvas';
import NodeConfigPanel from './components/NodeConfigPanel';
import ExecutionHistory from './components/ExecutionHistory';
import DebugPanel from './components/DebugPanel';

const RIGHT_PANEL_MIN = 250;
const RIGHT_PANEL_MAX = 600;
const RIGHT_PANEL_EXPANDED = 450;
const DEBUG_PANEL_MIN = 120;
const DEBUG_PANEL_MAX = 500;
const DEBUG_PANEL_DEFAULT = 200;

export default function App() {
  const { fetchWorkflows, showExecutionPanel, selectedNodeId, executionPanelTab, setExecutionPanelTab } = useWorkflowStore();
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(RIGHT_PANEL_MIN);
  const [debugPanelHeight, setDebugPanelHeight] = useState(DEBUG_PANEL_DEFAULT);
  const [darkMode, setDarkMode] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [showRedisSubManager, setShowRedisSubManager] = useState(false);
  const [showEmailTriggerManager, setShowEmailTriggerManager] = useState(false);
  const [showHttpTriggerManager, setShowHttpTriggerManager] = useState(false);
  const [showConfigStoreManager, setShowConfigStoreManager] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isDebugDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eflo_theme_mode');
      if (saved === 'dark') setDarkMode(true);
    } catch {
      // ignore
    }
    fetchWorkflows().then(() => restoreTabsOnStartup());
  }, []);

  const toggleThemeMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('eflo_theme_mode', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      startWidth.current = rightPanelWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const onMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = startX.current - ev.clientX;
        const newWidth = Math.min(RIGHT_PANEL_MAX, Math.max(RIGHT_PANEL_MIN, startWidth.current + delta));
        setRightPanelWidth(newWidth);
      };
      const onMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [rightPanelWidth]
  );

  const toggleExpand = useCallback(() => {
    setRightPanelWidth((w) => (w >= RIGHT_PANEL_EXPANDED ? RIGHT_PANEL_MIN : RIGHT_PANEL_EXPANDED));
  }, []);

  const onDebugMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDebugDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = debugPanelHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      const onMouseMove = (ev: MouseEvent) => {
        if (!isDebugDragging.current) return;
        const delta = startY.current - ev.clientY;
        const newHeight = Math.min(DEBUG_PANEL_MAX, Math.max(DEBUG_PANEL_MIN, startHeight.current + delta));
        setDebugPanelHeight(newHeight);
      };
      const onMouseUp = () => {
        isDebugDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [debugPanelHeight]
  );

  const tabIndex = executionPanelTab === 'history' ? 0 : 1;

  return (
    <ReactFlowProvider>
      <div
        className={`flex flex-col h-full ${darkMode ? 'app-root-dark' : 'app-root-light'}`}
        style={{ fontFamily: "var(--font-body, 'Atlassian Sans', sans-serif)" }}
      >
        <Toolbar
          toolboxOpen={toolboxOpen}
          onToggleToolbox={() => setToolboxOpen(!toolboxOpen)}
          darkMode={darkMode}
          toggleDarkMode={toggleThemeMode}
          showScheduleManager={showScheduleManager}
          setShowScheduleManager={setShowScheduleManager}
          showRedisSubManager={showRedisSubManager}
          setShowRedisSubManager={setShowRedisSubManager}
          showEmailTriggerManager={showEmailTriggerManager}
          setShowEmailTriggerManager={setShowEmailTriggerManager}
          showHttpTriggerManager={showHttpTriggerManager}
          setShowHttpTriggerManager={setShowHttpTriggerManager}
          showConfigStoreManager={showConfigStoreManager}
          setShowConfigStoreManager={setShowConfigStoreManager}
        />

        <div className="flex flex-1 overflow-hidden">
          {toolboxOpen && (
            <div
              className="flex flex-col flex-shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)]"
              style={{
                width: 230,
                ['--border' as string]: darkMode ? '#2e3138' : '#d8dde6',
                ['--bg' as string]: darkMode ? '#1f2227' : '#ffffff',
              }}
            >
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-[var(--border)]">
                <span className="text-[13px] font-bold text-[var(--text)]" style={{ ['--text' as string]: darkMode ? '#e2e8f0' : '#16325c' }}>
                  Toolbox
                </span>
                <button type="button" onClick={() => setToolboxOpen(false)} className="cursor-pointer text-sm text-neutral-500 hover:text-neutral-700 leading-none">
                  ✕
                </button>
              </div>
              <NodePalette
                onOpenScheduleManager={() => setShowScheduleManager(true)}
                onOpenRedisSubManager={() => setShowRedisSubManager(true)}
                onOpenEmailTriggerManager={() => setShowEmailTriggerManager(true)}
                onOpenHttpTriggerManager={() => setShowHttpTriggerManager(true)}
              />
            </div>
          )}

          <div className="flex-1 relative">
            <Canvas darkMode={darkMode} />
          </div>

          {selectedNodeId && (
            <div
              className="flex flex-shrink-0 relative overflow-y-auto bg-white border-l border-[#d8dde6]"
              style={{ width: rightPanelWidth }}
            >
              <div
                onMouseDown={onMouseDown}
                className="w-[5px] cursor-col-resize flex-shrink-0 relative z-10 hover:bg-[#d8dde6]"
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d8dde6')}
                onMouseLeave={(e) => {
                  if (!isDragging.current) e.currentTarget.style.background = 'transparent';
                }}
              />
              <div className="flex-1 overflow-y-auto relative">
                <button
                  type="button"
                  onClick={toggleExpand}
                  title={rightPanelWidth >= RIGHT_PANEL_EXPANDED ? 'Collapse panel' : 'Expand panel'}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded border border-[#d8dde6] bg-[#f3f2f2] flex items-center justify-center text-[10px] text-[#706e6b] z-[5] cursor-pointer hover:bg-[#e0e0e0]"
                >
                  {rightPanelWidth >= RIGHT_PANEL_EXPANDED ? '⟫' : '⟪'}
                </button>
                <NodeConfigPanel />
              </div>
            </div>
          )}
        </div>

        {showExecutionPanel && (
          <div
            className="flex flex-col flex-shrink-0 border-t border-[var(--border)]"
            style={{
              height: debugPanelHeight,
              ['--border' as string]: darkMode ? '#2e3138' : '#d8dde6',
              background: darkMode ? '#1f2227' : '#fff',
            }}
          >
            <div
              onMouseDown={onDebugMouseDown}
              className="h-[5px] cursor-row-resize flex-shrink-0 z-10 hover:bg-[var(--border)]"
              style={{ ['--border' as string]: darkMode ? '#2e3138' : '#d8dde6' }}
            />
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <Tabs
                id="exec-panel-tabs"
                selected={tabIndex}
                onChange={(idx: number) => setExecutionPanelTab(idx === 0 ? 'history' : 'debug')}
              >
                <TabList>
                  <Tab>History</Tab>
                  <Tab>Debug</Tab>
                </TabList>
                <TabPanel>
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <ExecutionHistory darkMode={darkMode} />
                  </div>
                </TabPanel>
                <TabPanel>
                  <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                    <DebugPanel darkMode={darkMode} />
                  </div>
                </TabPanel>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}
