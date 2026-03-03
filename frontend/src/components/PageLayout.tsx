import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import Button from '@atlaskit/button';
import Tooltip from '@atlaskit/tooltip';
import { PRIMARY } from '../theme';
import { Icons } from './ui/Icons';

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

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium px-2 py-1 rounded text-white hover:bg-white/10 ${active ? 'text-amber-300' : ''}`;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'app-root-dark' : 'app-root-light'}`}>
      <header
        className="flex items-center px-3 h-[42px] flex-shrink-0"
        style={{ background: PRIMARY, color: '#fff' }}
      >
        <Link to="/" className="flex items-center gap-2 text-white no-underline">
          <span className="text-[13px] font-bold tracking-wide">⚡ Flow Builder</span>
        </Link>
        <div className="w-px h-4 bg-white/30 ml-3" />
        <nav className="flex items-center gap-1 ml-2">
          <Link to="/" className={navLinkClass(location.pathname === '/' || location.pathname === '/home')}>
            <span className="flex items-center gap-1.5">
              <Icons.Home />
              Home
            </span>
          </Link>
          <Link to="/flows" className={navLinkClass(location.pathname === '/flows' || location.pathname.startsWith('/flows/'))}>
            <span className="flex items-center gap-1.5">
              <Icons.List />
              Flows
            </span>
          </Link>
          <Link to="/wf-new" className={navLinkClass(location.pathname === '/wf-new')}>
            <span className="flex items-center gap-1.5">
              <Icons.Edit />
              Builder
            </span>
          </Link>
          <Link to="/kb" className={navLinkClass(location.pathname === '/kb' || location.pathname.startsWith('/kb/'))}>
            <span className="flex items-center gap-1.5">
              <Icons.Book />
              Knowledge Base
            </span>
          </Link>
        </nav>
        <div className="flex-1" />
        <Tooltip content={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
          <Button appearance="subtle" onClick={toggleDarkMode} className="[&_span]:!text-white">
            <Icons.Lightbulb />
          </Button>
        </Tooltip>
        <div className="w-px h-4 bg-white/30 mx-1" />
        <Tooltip content="Help">
          <Button appearance="subtle" className="[&_span]:!text-white">
            <Icons.Question />
          </Button>
        </Tooltip>
      </header>

      {title != null && (
        <div
          className="flex items-center px-3 h-8 flex-shrink-0 border-b"
          style={{
            background: darkMode ? '#1f2227' : '#f3f2f2',
            borderColor: darkMode ? '#2e3138' : '#d8dde6',
          }}
        >
          <span className="text-xs font-semibold" style={{ color: darkMode ? '#e2e8f0' : '#16325c' }}>
            {title}
          </span>
        </div>
      )}

      <main className="flex-1 overflow-auto p-3 min-h-0">
        {children}
      </main>
    </div>
  );
}
