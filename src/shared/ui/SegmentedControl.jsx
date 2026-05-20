export const SegmentedControl = ({ options, value, onChange, className = '' }) => (
  <div className={`inline-flex rounded-full bg-[var(--bg-elevated)] p-1 ${className}`}>
    {options.map((option) => (
      <button
        type="button"
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          value === option.value ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);
