export const SegmentedControl = ({ options, value, onChange, className = '' }) => (
  <div className={`inline-flex rounded-xl bg-white/10 p-1 ${className}`}>
    {options.map((option) => (
      <button
        type="button"
        key={option.value}
        onClick={() => onChange(option.value)}
        className={`rounded-lg px-4 py-2 text-sm font-extrabold transition ${
          value === option.value ? 'bg-white text-[var(--text-primary)] shadow-card' : 'text-white/65 hover:text-white'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);
