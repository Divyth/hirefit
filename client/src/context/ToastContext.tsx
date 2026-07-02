import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Toast = { id: number; type: 'success' | 'error' | 'info'; message: string };

type ToastContextValue = {
  pushToast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-soft backdrop-blur ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : toast.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-slate-200 bg-white/90 text-slate-900'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider');
  return value;
}
