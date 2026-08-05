import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'w-5 h-5', label = 'Loading…' }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-[var(--ink-faint)]">
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}
