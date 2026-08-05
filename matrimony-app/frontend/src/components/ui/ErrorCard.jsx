import { AlertTriangle, X } from 'lucide-react';

export default function ErrorCard({ title = 'Something went wrong', message, onRetry, onDismiss, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--error-border)] bg-[var(--error-soft)] p-4 animate-[fade-in-up_0.25s_ease-out_both] ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--error)]" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[var(--error)]">{title}</p>
          {message && <p className="text-[13px] text-[var(--ink-soft)] mt-1 leading-snug">{message}</p>}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-[13px] font-bold text-[var(--error)] underline decoration-2 underline-offset-2 hover:opacity-80"
            >
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
