const VARIANTS = {
  primary: 'bg-[var(--primary-soft)] text-[var(--primary-strong)]',
  success: 'bg-[var(--success-soft)] text-[var(--success)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  error: 'bg-[var(--error-soft)] text-[var(--error)]',
  neutral: 'bg-[var(--surface-muted)] text-[var(--ink-soft)]',
  outline: 'bg-transparent border border-[var(--border-strong)] text-[var(--ink-soft)]',
};

export default function Badge({ variant = 'primary', icon, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${VARIANTS[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
