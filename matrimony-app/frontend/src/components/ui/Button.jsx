import { useState } from 'react';
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
  const [ripples, setRipples] = useState([]);

  const spawnRipple = (e) => {
    const el = e.currentTarget;
    if (!el || e.button !== 0) return;
    const rect = el.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height) * 1.2;
    const key = `${Date.now()}-${Math.random()}`;
    const ripple = {
      key,
      left: e.clientX - rect.left - d / 2,
      top: e.clientY - rect.top - d / 2,
      size: d,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.key !== key));
    }, 650);
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onPointerDown={spawnRipple}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`btn ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {ripples.map((r) => (
        <span
          key={r.key}
          className="ripple-ink"
          style={{ width: r.size, height: r.size, left: r.left, top: r.top }}
          aria-hidden="true"
        />
      ))}
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
      {!loading && success ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
      <span className="relative z-10 inline-flex items-center gap-2">
        {success ? (successLabel ?? children) : children}
      </span>
    </button>
  );
}
