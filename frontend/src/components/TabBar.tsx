import { useWorkflowStore } from '../store/workflowStore';
import { PRIMARY } from '../theme';

export default function TabBar() {
  const openTabs = useWorkflowStore((s) => s.openTabs);
  const activeTabId = useWorkflowStore((s) => s.activeTabId);
  const switchTab = useWorkflowStore((s) => s.switchTab);
  const closeTab = useWorkflowStore((s) => s.closeTab);

  if (openTabs.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        background: '#e8e8e8',
        borderBottom: '1px solid #d8dde6',
        height: 30,
        overflow: 'hidden',
        flexShrink: 0,
        paddingLeft: 4,
        gap: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          overflow: 'auto',
          flex: 1,
          gap: 1,
          scrollbarWidth: 'none',
        }}
      >
        {openTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              onMouseDown={(e) => {
                // Middle-click to close
                if (e.button === 1) {
                  e.preventDefault();
                  closeTab(tab.id);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 10px',
                height: isActive ? 28 : 26,
                cursor: 'pointer',
                background: isActive ? '#fff' : 'transparent',
                borderTop: isActive ? `2px solid ${PRIMARY}` : '2px solid transparent',
                borderLeft: isActive ? '1px solid #d8dde6' : '1px solid transparent',
                borderRight: isActive ? '1px solid #d8dde6' : '1px solid transparent',
                borderBottom: isActive ? '1px solid #fff' : '1px solid transparent',
                borderRadius: '4px 4px 0 0',
                transition: 'all 0.1s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                marginBottom: isActive ? -1 : 0,
                position: 'relative',
                zIndex: isActive ? 2 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? PRIMARY : '#555',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tab.name}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                style={{
                  fontSize: 11,
                  color: '#999',
                  fontWeight: 300,
                  lineHeight: 1,
                  width: 14,
                  height: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 3,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ddd';
                  e.currentTarget.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                ✕
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

