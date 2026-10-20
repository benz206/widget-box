"use client";

import Icon, { type IconName } from "./Icon";

type Option<T extends string> = { value: T; label: string; icon?: IconName };

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
  const pad = size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-3 text-[13px]";
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
            aria-label={option.icon ? option.label : undefined}
            title={option.icon ? option.label : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(option.value)}
            className={`press focus-ring flex flex-1 items-center justify-center whitespace-nowrap rounded-[4px] font-medium ${pad} ${
              selected ? "text-label" : "text-secondary hover:text-label"
            }`}
            style={
              selected
                ? {
                    background: "var(--elevated-solid)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.12), 0 0 0 1px var(--separator)",
                  }
                : undefined
            }
          >
            {option.icon ? <Icon name={option.icon} size={14} /> : option.label}
          </button>
        );
      })}
    </div>
  );
}
