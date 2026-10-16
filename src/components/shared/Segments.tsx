/** A labelled row of buttons, one pressed at a time. Used inside client components. */
export function Segments<T extends string | number>({
  label,
  options,
  value,
  onChange,
  event,
}: {
  label: string;
  options: { value: T; label: string; ariaLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Analytics event counted on a click; numeric options also send their value as the level. */
  event?: string;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="segments">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="segment"
            aria-pressed={option.value === value}
            aria-label={option.ariaLabel}
            data-ga-event={event}
            data-ga-level={event && typeof option.value === "number" ? option.value : undefined}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
