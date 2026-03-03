import { createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  type: ToastType;
  content: string;
}

interface ToastContextValue {
  success: (content: string) => void;
  error: (content: string) => void;
  info: (content: string) => void;
  warning: (content: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((type: ToastType, content: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, type, content }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  const api = {
    success: (c: string) => add('success', c),
    error: (c: string) => add('error', c),
    info: (c: string) => add('info', c),
    warning: (c: string) => add('warning', c),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded px-4 py-2 text-sm font-medium shadow-lg"
            style={{
              background:
                t.type === 'success'
                  ? '#00875a'
                  : t.type === 'error'
                    ? '#de350b'
                    : t.type === 'warning'
                      ? '#ffab00'
                      : '#0052CC',
              color: '#fff',
            }}
          >
            {t.content}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}
