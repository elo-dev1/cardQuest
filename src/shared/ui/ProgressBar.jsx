export const ProgressBar = ({ value = 0, color = 'linear-gradient(90deg,#fbbf24,#f59e0b)', height = 8, label }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      {label ? <div className="mb-1 text-xs font-bold text-white/70">{label}</div> : null}
      <div className="w-full overflow-hidden rounded-full bg-white/10" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${safeValue}%`, background: color }}
        />
      </div>
    </div>
  );
};
