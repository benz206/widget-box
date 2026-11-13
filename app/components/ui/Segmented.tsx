import { useId } from "react";
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
  const name = useId();
  const pad = size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-3 text-[13px]";
  return (
    <div
      role="radiogroup"
      className={`inline-flex gap-0.5 rounded-control bg-fill p-0.5 ${className ?? ""}`}
    >
      {options.map((option) => (
        <label
          key={option.value}
          title={option.icon ? option.label : undefined}
          onPointerDown={(e) => e.stopPropagation()}
          className={`relative segmented-option press focus-ring flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-[4px] font-medium ${pad}`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            aria-label={option.icon ? option.label : undefined}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.icon ? <Icon name={option.icon} size={14} /> : option.label}
        </label>
      ))}
    </div>
  );
}
