import { useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { Link, useLocation } from 'react-router';
import { Button, Tooltip, Typography } from 'antd';
import { HomeOutlined, UnorderedListOutlined, EditOutlined, BulbOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { PRIMARY, splunkTheme } from '../theme';
import '../splunkui.css';

const { Text } = Typography;

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

interface PageLayoutProps {
  title?: string;
  children: React.ReactNode;
}

export default function PageLayout({ title, children }: PageLayoutProps) {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eflo_theme_mode');
      setDarkMode(saved === 'dark');
    } catch {
      // ignore
    }
  }, []);

  const toggleDarkMode = () => {
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

  return (
    <ConfigProvider theme={darkMode ? splunkTheme : lightTheme}>
      <div
        className={darkMode ? 'app-root-dark' : 'app-root-light'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          fontFamily: "'Salesforce Sans', 'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Row 1: Same header as wf-new — PRIMARY bar, no right controls */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            height: 42,
            background: PRIMARY,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', textDecoration: 'none' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>⚡ Flow Builder</span>
          </Link>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)', marginLeft: 12 }} />
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            <Link to="/">
              <Button
                type="text"
                size="small"
                icon={<HomeOutlined />}
                style={{
                  color: location.pathname === '/' || location.pathname === '/home' ? '#ffd700' : '#fff',
                }}
              >
                Home
              </Button>
            </Link>
            <Link to="/flows">
              <Button
                type="text"
                size="small"
                icon={<UnorderedListOutlined />}
                style={{
                  color: location.pathname === '/flows' || location.pathname.startsWith('/flows/') ? '#ffd700' : '#fff',
                }}
              >
                Flows
              </Button>
            </Link>
            <Link to="/wf-new">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                style={{
                  color: location.pathname === '/wf-new' ? '#ffd700' : '#fff',
                }}
              >
                Builder
              </Button>
            </Link>
          </nav>
          <div style={{ flex: 1 }} />
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Button type="text" size="small" icon={<BulbOutlined />} style={{ color: '#fff' }} onClick={toggleDarkMode} />
          </Tooltip>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.3)', margin: '0 4px' }} />
          <Tooltip title="Help">
            <Button type="text" size="small" icon={<QuestionCircleOutlined />} style={{ color: '#fff' }} />
          </Tooltip>
        </header>

        {/* Row 2: Page title bar — same density as wf-new secondary toolbar */}
        {title != null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              height: 32,
              background: darkMode ? '#1f2227' : '#f3f2f2',
              borderBottom: darkMode ? '1px solid #2e3138' : '1px solid #d8dde6',
              flexShrink: 0,
            }}
          >
            <Text strong style={{ fontSize: 12, color: darkMode ? '#e2e8f0' : '#16325c' }}>
              {title}
            </Text>
          </div>
        )}

        {/* Content — same density: compact padding, no right sidebar */}
        <main
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            minHeight: 0,
          }}
        >
          {children}
        </main>
      </div>
    </ConfigProvider>
  );
}
