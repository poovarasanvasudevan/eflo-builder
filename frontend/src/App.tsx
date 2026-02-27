import { useEffect, useState, useCallback, useRef } from 'react';
import { ConfigProvider, theme } from 'antd';
import { ReactFlowProvider } from '@xyflow/react';
import { useWorkflowStore, restoreTabsOnStartup } from './store/workflowStore';
import { PRIMARY, splunkTheme } from './theme';
import Toolbar from './components/Toolbar';
import NodePalette from './components/NodePalette';
import Canvas from './components/Canvas';
import NodeConfigPanel from './components/NodeConfigPanel';
import ExecutionHistory from './components/ExecutionHistory';
import './splunkui.css'

const RIGHT_PANEL_MIN = 250;
const RIGHT_PANEL_MAX = 600;
const RIGHT_PANEL_EXPANDED = 450;

const DEBUG_PANEL_MIN = 120;
const DEBUG_PANEL_MAX = 500;
const DEBUG_PANEL_DEFAULT = 200;

export default function App() {
  const { fetchWorkflows, showExecutionPanel, selectedNodeId } = useWorkflowStore();
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(RIGHT_PANEL_MIN);
  const [debugPanelHeight, setDebugPanelHeight] = useState(DEBUG_PANEL_DEFAULT);
  const [darkMode, setDarkMode] = useState(false);
  const [showScheduleManager, setShowScheduleManager] = useState(false);
  const [showRedisSubManager, setShowRedisSubManager] = useState(false);
  const [showEmailTriggerManager, setShowEmailTriggerManager] = useState(false);
  const [showHttpTriggerManager, setShowHttpTriggerManager] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isDebugDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eflo_theme_mode');
      if (saved === 'dark') {
        setDarkMode(true);
      }
    } catch {
      // ignore
    }
    fetchWorkflows().then(() => {
      restoreTabsOnStartup();
    });
  }, []);

  const toggleThemeMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('eflo_theme_mode', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Drag-to-resize for right panel
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = rightPanelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - ev.clientX; // dragging left = wider
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
  }, [rightPanelWidth]);

  const toggleExpand = useCallback(() => {
    setRightPanelWidth((w) => w >= RIGHT_PANEL_EXPANDED ? RIGHT_PANEL_MIN : RIGHT_PANEL_EXPANDED);
  }, []);

  // Drag-to-resize for bottom debug panel
  const onDebugMouseDown = useCallback((e: React.MouseEvent) => {
    isDebugDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = debugPanelHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDebugDragging.current) return;
      const delta = startY.current - ev.clientY; // dragging up = taller
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
  }, [debugPanelHeight]);

  const lightTheme = {
    algorithm: theme.compactAlgorithm,
    token: {
      fontSize: 12,
      colorPrimary: PRIMARY,
      controlHeight: 26,
      borderRadius: 0,
      fontFamily: `"Splunk Platform Sans", 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    },
  };

  return (
    <ConfigProvider
      theme={darkMode ? splunkTheme : lightTheme}
    >
      <ReactFlowProvider>
        <div
          className={darkMode ? 'app-root-dark' : 'app-root-light'}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Salesforce Sans', 'Inter', -apple-system, sans-serif" }}
        >
          {/* Top Toolbar (two rows like Flow Builder) */}
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
          />


          {/* Main Content */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Sidebar - Toolbox */}
            {toolboxOpen && (
              <div
                style={{
                  width: 220,
                  borderRight: darkMode ? '1px solid #2e3138' : '1px solid #d8dde6',
                  background: darkMode ? '#1f2227' : '#ffffff',
                  overflowY: 'auto',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  borderBottom: darkMode ? '1px solid #2e3138' : '1px solid #d8dde6',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: darkMode ? '#e2e8f0' : '#16325c' }}>Toolbox</span>
                  <span
                    onClick={() => setToolboxOpen(false)}
                    style={{ cursor: 'pointer', fontSize: 14, color: darkMode ? '#8b95a5' : '#706e6b', fontWeight: 300, lineHeight: 1 }}
                  >✕</span>
                </div>
                <NodePalette
                  onOpenScheduleManager={() => setShowScheduleManager(true)}
                  onOpenRedisSubManager={() => setShowRedisSubManager(true)}
                  onOpenEmailTriggerManager={() => setShowEmailTriggerManager(true)}
                  onOpenHttpTriggerManager={() => setShowHttpTriggerManager(true)}
                />
              </div>
            )}

            {/* Center - Canvas */}
            <div style={{ flex: 1, position: 'relative' }}>
              <Canvas darkMode={darkMode} />
            </div>

            {/* Right Sidebar - Config Panel (only when a node is selected) */}
            {selectedNodeId && (
              <div
                style={{
                  width: rightPanelWidth,
                  borderLeft: '1px solid #d8dde6',
                  background: '#ffffff',
                  overflowY: 'auto',
                  flexShrink: 0,
                  position: 'relative',
                  display: 'flex',
                }}
              >
                {/* Drag handle */}
                <div
                  onMouseDown={onMouseDown}
                  style={{
                    width: 5,
                    cursor: 'col-resize',
                    background: 'transparent',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#d8dde6')}
                  onMouseLeave={(e) => { if (!isDragging.current) e.currentTarget.style.background = 'transparent'; }}
                />
                {/* Panel content */}
                <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                  {/* Expand/collapse toggle */}
                  <div
                    onClick={toggleExpand}
                    title={rightPanelWidth >= RIGHT_PANEL_EXPANDED ? 'Collapse panel' : 'Expand panel'}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 20,
                      height: 20,
                      borderRadius: 3,
                      background: '#f3f2f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 10,
                      color: '#706e6b',
                      zIndex: 5,
                      border: '1px solid #d8dde6',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e0e0e0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f2f2'; }}
                  >
                    {rightPanelWidth >= RIGHT_PANEL_EXPANDED ? '⟫' : '⟪'}
                  </div>
                  <NodeConfigPanel />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel - Execution History (resizable) */}
          {showExecutionPanel && (
            <div
              style={{
                height: debugPanelHeight,
                borderTop: '1px solid #d8dde6',
                background: '#fff',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Drag handle for vertical resize */}
              <div
                onMouseDown={onDebugMouseDown}
                style={{
                  height: 5,
                  cursor: 'row-resize',
                  background: 'transparent',
                  flexShrink: 0,
                  zIndex: 10,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d8dde6')}
                onMouseLeave={(e) => { if (!isDebugDragging.current) e.currentTarget.style.background = 'transparent'; }}
              />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ExecutionHistory />
              </div>
            </div>
          )}
        </div>
      </ReactFlowProvider>
    </ConfigProvider>
  );
}
