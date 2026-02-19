'use client';
import { createContext, useContext, useMemo, useState } from 'react';

type Toast = { id: number; text: string; type: 'success' | 'error' };
const ToastCtx = createContext<{ push: (text: string, type?: Toast['type']) => void }>({ push: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const value = useMemo(() => ({
    push: (text: string, type: Toast['type'] = 'success') => {
      const id = Date.now();
      setToasts((t) => [...t, { id, text, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
    },
  }), []);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className='fixed top-4 right-4 space-y-2 z-50'>
        {toasts.map((t) => <div key={t.id} className={`px-3 py-2 rounded text-sm ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{t.text}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { return useContext(ToastCtx); }
