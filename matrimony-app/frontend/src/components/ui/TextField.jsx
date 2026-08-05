import { forwardRef, useId } from 'react';
import FieldMessage from './FieldMessage';

/**
 * Premium text field with floating label, icon, validation states,
 * character counter and full ARIA wiring. Works controlled or via
 * react-hook-form register() spread:  <TextField {...register('name')} />
 */
const TextField = forwardRef(function TextField(
  {
    label,
    icon,
    right,
    error,
    help,
    success,
    counter,
    required,
    floating = true,
    className = '',
    inputClassName = '',
    id,
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `tf-${autoId}`;
  const msgId = `${inputId}-msg`;
  const hasMsg = !!(error || success || help);
  const stateClass = error ? 'input-error' : success ? 'input-success' : '';
  const valueLength = String(rest.value ?? '').length;

  const base = {
    id: inputId,
    ref,
    'aria-invalid': !!error,
    'aria-describedby': hasMsg ? msgId : undefined,
    required,
    ...rest,
  };

  if (floating) {
    return (
      <div className={`fl-field ${className}`}>
        {icon && (
          <span className="fl-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          {...base}
          placeholder=" "
          className={`fl-input ${icon ? 'fl-has-icon' : ''} ${right ? 'fl-has-right' : ''} ${stateClass} ${inputClassName}`}
        />
        <label className="fl-label" htmlFor={inputId}>
          {label}
          {required && <span className="text-[var(--error)]"> *</span>}
        </label>
        {right}
        {counter ? (
          <div className="mt-1 text-right text-[11px] font-semibold text-[var(--ink-faint)]" aria-hidden="true">
            {valueLength}/{counter}
          </div>
        ) : null}
        <FieldMessage error={error} success={success} help={help} id={msgId} />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
          {label}
          {required && <span className="text-[var(--error)]"> *</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          {...base}
          className={`input-base ${icon ? 'pl-10' : ''} ${right ? 'pr-11' : ''} ${stateClass} ${inputClassName}`}
        />
        {right}
      </div>
      {counter ? (
        <div className="mt-1 text-right text-[11px] font-semibold text-[var(--ink-faint)]" aria-hidden="true">
          {valueLength}/{counter}
        </div>
      ) : null}
      <FieldMessage error={error} success={success} help={help} id={msgId} />
    </div>
  );
});

export default TextField;
