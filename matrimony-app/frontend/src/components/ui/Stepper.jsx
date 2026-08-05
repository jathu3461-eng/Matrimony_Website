import { Check } from 'lucide-react';

/**
 * Horizontal stepper. `current` is 0-based index of the active step.
 * `onStepClick(i)` lets users jump back to already-visited steps.
 */
export default function Stepper({ steps = [], current = 0, onStepClick, vertical = false }) {
  if (vertical) {
    return (
      <ol className="flex flex-col gap-0" aria-label="Progress">
        {steps.map((s, i) => {
          const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
          const clickable = onStepClick && (i < current || i === current);
          return (
            <li key={s.label} className="relative flex items-start gap-3 pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[11px] top-7 bottom-0 w-0.5 rounded-full ${i < current ? 'bg-[var(--primary)]' : 'bg-[var(--border-soft)]'}`}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onClick={() => clickable && onStepClick(i)}
                disabled={!clickable}
                className={`step-dot shrink-0 z-10 ${
                  state === 'complete'
                    ? 'step-complete'
                    : state === 'current'
                      ? 'step-current'
                      : 'step-upcoming'
                }`}
                aria-current={state === 'current' ? 'step' : undefined}
                aria-label={state === 'complete' ? `${s.label} (completed)` : s.label}
              >
                {state === 'complete' ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
              </button>
              <div className="min-w-0 pt-0.5">
                <p
                  className={`text-[13px] font-bold leading-tight ${
                    state === 'current' ? 'text-[var(--primary-strong)]' : state === 'complete' ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]'
                  }`}
                >
                  {s.label}
                </p>
                {s.hint && (
                  <p className="text-[11px] text-[var(--ink-faint)] mt-0.5 leading-snug">{s.hint}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="flex items-start w-full" aria-label="Progress">
      {steps.map((s, i) => {
        const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
        const clickable = onStepClick && (i < current || i === current);
        return (
          <li key={s.label} className="flex items-center flex-1 last:flex-none">
            {i > 0 && (
              <span
                className={`step-line ${i <= current ? 'step-complete' : ''}`}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={() => clickable && onStepClick(i)}
              disabled={!clickable}
              className="flex flex-col items-center gap-1.5 shrink-0"
              aria-current={state === 'current' ? 'step' : undefined}
              aria-label={state === 'complete' ? `${s.label} (completed)` : s.label}
            >
              <span
                className={`step-dot ${
                  state === 'complete'
                    ? 'step-complete'
                    : state === 'current'
                      ? 'step-current'
                      : 'step-upcoming'
                }`}
              >
                {state === 'complete' ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
              </span>
              <span
                className={`text-[11px] font-bold text-center leading-tight max-w-[6.5rem] ${
                  state === 'current' ? 'text-[var(--primary-strong)]' : 'text-[var(--ink-soft)]'
                }`}
              >
                {s.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
