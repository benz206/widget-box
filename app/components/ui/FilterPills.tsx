export default function FilterPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="filter-group">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className="filter-pill focus-ring"
        >
          {option.label}
          {option.count !== undefined && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
