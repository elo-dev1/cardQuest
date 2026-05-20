export const ProgressBar = ({ value = 0, color, height = 8, label, variant = 'sage' }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  const fillClass = color ? undefined : `progress-fill progress-${variant}`;

  return (
    <div className="w-full">
      {label ? <div className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{label}</div> : null}
      <div className="progress-track" style={{ height }}>
        <div
          className={fillClass || 'progress-fill'}
          style={{ width: `${safeValue}%`, ...(color ? { background: color } : {}) }}
        />
      </div>
    </div>
  );
};
