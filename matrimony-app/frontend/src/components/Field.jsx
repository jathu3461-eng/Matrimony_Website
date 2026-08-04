export default function Field({ label, error, formatHint, children }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-[#4a2a1a] mb-1.5">{label}</label>}
      {children}
      {error && (
        <div className="field-error text-red-600 font-bold mt-1">
          <div>Error: {error}</div>
          {formatHint && (
            <div className="format-hint text-orange-800 font-normal text-xs mt-0.5">
              Required format: {formatHint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
