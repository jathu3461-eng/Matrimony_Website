import { useRef } from 'react';
import { Loader2, Check } from 'lucide-react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  soft: 'btn-soft',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  success = false,
  disabled = false,
  fullWidth = false,
  successLabel,
  onClick,
  className = '',
  ariaLabel,
  ...rest
}) {
  const ref = useRef(null);

  const spawnRipple = (e) => {
    const el = ref.current;
    if (!el || e.button !== 0 || e.pointerType === 'touch' && e.type !== 'pointerdown') return;
    const rect = el.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 1.2;
    const span = document.createElement('span');
    span.className = 'ripple-ink';
    span.style.width = `${d}px`;
    span.style.height = `${d}px`;
    span.style.left = `${e.clientX - rect.left - d / 2}px`;
    span.style.top = `${e.clientY - rect.top - d / 2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 650);
  };

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      onPointerDown={spawnRipple}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
      {!loading && success ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
      <span className="relative z-10 inline-flex items-center gap-2">
        {success ? (successLabel ?? children) : children}
      </span>
    </button>
  );
}
