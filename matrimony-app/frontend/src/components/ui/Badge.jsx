const VARIANTS = {
  primary: 'bg-[var(--primary-soft)] text-[var(--primary-strong)]',
  success: 'bg-[var(--success-soft)] text-[var(--success)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  error: 'bg-[var(--error-soft)] text-[var(--error)]',
  neutral: 'bg-[var(--surface-muted)] text-[var(--ink-soft)]',
  outline: 'bg-transparent border border-[var(--border-strong)] text-[var(--ink-soft)]',
  gradient: 'grad-primary text-white shadow-[0_4px_14px_-4px_rgba(224,19,106,0.5)]',
};

export default function Badge({
  variant = 'primary',
  icon,
  children,
  className = '',
  dot = false,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
        VARIANTS[variant] || VARIANTS.primary
      } ${className}`}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
      )}
      {icon}
      {children}
    </span>
  );
}
