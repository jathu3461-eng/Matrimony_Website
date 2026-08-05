export default function Skeleton({ className = '', circle = false, style }) {
  return (
    <div
      className={`skeleton ${circle ? 'rounded-full shrink-0' : 'rounded-lg'} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
