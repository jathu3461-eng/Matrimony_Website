import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLORS = {
  success: 'text-[var(--success)]',
  error: 'text-[var(--error)]',
  info: 'text-[var(--primary)]',
};

function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,24rem)]"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 48, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 48, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="glass-card flex items-start gap-3 p-4 rounded-2xl shadow-[var(--shadow-elevated)] border border-[var(--border-soft)]"
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${COLORS[t.type]}`} aria-hidden="true" />
              <p className="text-sm font-semibold text-[var(--ink)] flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, message, options = {}) => {
      const id = ++idRef.current;
      const duration = options.duration ?? (type === 'error' ? 6000 : 3500);
      setToasts((t) => [...t, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      info: (m, o) => push('info', m, o),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
