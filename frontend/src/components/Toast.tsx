import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { playError, playClick, playCopySuccess } from '../lib/audio';

type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

let _nextId = 0;

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = _nextId++;

    // Play corresponding SFX
    if (type === 'error') playError();
    else if (type === 'success') playCopySuccess();
    else if (type === 'warning') playClick();

    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDone={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), toast.duration - 400);
    const removeTimer = setTimeout(onDone, toast.duration);
    return () => { clearTimeout(timer); clearTimeout(removeTimer); };
  }, [toast.duration, onDone]);

  const colorMap: Record<ToastType, string> = {
    error: 'var(--red)',
    success: 'var(--green)',
    warning: 'var(--gold)',
    info: 'var(--cyan)',
  };

  const iconMap: Record<ToastType, string> = {
    error: 'X',
    success: '+',
    warning: '!',
    info: '>',
  };

  return (
    <div
      className={`toast-item ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ borderColor: colorMap[toast.type] }}
      onClick={() => { setExiting(true); setTimeout(onDone, 300); }}
    >
      <span className="toast-icon" style={{ color: colorMap[toast.type] }}>
        [{iconMap[toast.type]}]
      </span>
      <span className="toast-message">{toast.message}</span>
    </div>
  );
}
