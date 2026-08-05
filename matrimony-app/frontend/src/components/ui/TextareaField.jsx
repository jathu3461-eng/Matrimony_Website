import { forwardRef, useId } from 'react';
import FieldMessage from './FieldMessage';

const TextareaField = forwardRef(function TextareaField(
  {
    label,
    error,
    help,
    success,
    required,
    counter,
    rows = 4,
    className = '',
    id,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `ta-${autoId}`;
  const msgId = `${inputId}-msg`;
  const hasMsg = !!(error || success || help);
  const stateClass = error ? 'input-error' : success ? 'input-success' : '';
  const valueLength = String(rest.value ?? '').length;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
          {label}
          {required && <span className="text-[var(--error)]"> *</span>}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`input-base resize-y leading-relaxed ${stateClass}`}
        aria-invalid={!!error}
        aria-describedby={hasMsg ? msgId : undefined}
        required={required}
        {...rest}
      />
      {counter ? (
        <div className="mt-1 text-right text-[11px] font-semibold text-[var(--ink-faint)]" aria-hidden="true">
          {valueLength}/{counter}
        </div>
      ) : null}
      <FieldMessage error={error} success={success} help={help} id={msgId} />
    </div>
  );
});

export default TextareaField;
