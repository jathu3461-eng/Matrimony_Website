import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import FieldMessage from './FieldMessage';

const SelectField = forwardRef(function SelectField(
  {
    label,
    options = [],
    placeholder = 'Select…',
    error,
    help,
    success,
    required,
    icon,
    className = '',
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = `sf-${autoId}`;
  const msgId = `${inputId}-msg`;
  const hasMsg = !!(error || success || help);
  const stateClass = error ? 'input-error' : success ? 'input-success' : '';

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--ink-soft)] mb-1.5">
          {label}
          {required && <span className="text-[var(--error)]"> *</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-faint)] pointer-events-none" aria-hidden="true">
            {icon}
          </span>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`input-base appearance-none pr-10 ${icon ? 'pl-10' : ''} ${stateClass} group-focus-within:border-[var(--primary)]`}
          aria-invalid={!!error}
          aria-describedby={hasMsg ? msgId : undefined}
          required={required}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-faint)] group-focus-within:text-[var(--primary)] transition-colors"
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </div>
      <FieldMessage error={error} success={success} help={help} id={msgId} />
    </div>
  );
});

export default SelectField;
