export default function ProgressBar({
  value = 0,
  showLabel = true,
  label = 'Profile completion',
  className = '',
}) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-[var(--ink-soft)]">{label}</span>
        <span className="text-xs font-extrabold text-[var(--primary-strong)]">{Math.round(v)}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(v)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={label}
      >
        <div
          className="progress-fill transition-[width] duration-500 ease-out"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
