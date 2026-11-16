import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../lib/cn.js';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const STYLES = {
  success: 'border-success/30 bg-white text-cocoa-900',
  error: 'border-danger/30 bg-white text-cocoa-900',
  info: 'border-info/30 bg-white text-cocoa-900',
};
const ICON_STYLES = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
};

function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.variant] ?? Info;

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 shadow-lift',
        STYLES[toast.variant] ?? STYLES.info,
      )}
    >
      <Icon
        className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_STYLES[toast.variant] ?? 'text-info')}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm text-cocoa-600">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-full p-1 text-cocoa-500 transition-colors hover:bg-cream-200 hover:text-cocoa-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }) => {
      const id =
        globalThis.crypto?.randomUUID?.() ??
        `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current.slice(-3), { id, title, description, variant }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ addToast, dismiss }), [addToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col gap-2 sm:left-auto sm:w-96"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}

export default ToastContext;
