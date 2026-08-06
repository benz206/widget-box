"use client";

type Option<T extends string> = { value: T; label: string };

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[13px]";
  return (
    <div
      role="group"
      className={`inline-flex gap-0.5 rounded-control bg-fill p-0.5 ${className ?? ""}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(option.value)}
            className={`press focus-ring flex-1 whitespace-nowrap rounded-[7px] font-medium ${pad} ${
              selected ? "text-label" : "text-secondary hover:text-label"
            }`}
            style={
              selected
                ? {
                    background: "var(--elevated-solid)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.16)",
                  }
                : undefined
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
