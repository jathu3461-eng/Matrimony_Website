export default function Skeleton({ className = '', circle = false, rounded, style }) {
  return (
    <div
      className={`skeleton ${
        circle ? 'rounded-full shrink-0' : rounded ? `rounded-${rounded}` : 'rounded-lg'
      } ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
