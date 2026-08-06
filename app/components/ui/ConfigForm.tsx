"use client";

import type { ConfigField } from "@/lib/widgets/types";
import Icon from "./Icon";

const inputClass =
  "focus-ring w-full rounded-control bg-fill px-3 py-2 text-[13px] text-label placeholder:text-tertiary outline-none";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => onChange(!checked)}
      className="focus-ring relative h-[30px] w-[50px] shrink-0 rounded-full"
      style={{
        background: checked ? "var(--positive)" : "var(--fill-tertiary)",
        transition: "background-color 220ms var(--ease-ios)",
      }}
    >
      <span
        className="absolute top-[2px] block h-[26px] w-[26px] rounded-full bg-white"
        style={{
          left: checked ? 22 : 2,
          boxShadow: "0 2px 5px rgba(0,0,0,0.22)",
          transition: "left 240ms var(--ease-ios)",
        }}
      />
    </button>
  );
}

function Control({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.kind) {
    case "select":
      return (
        <div className="relative">
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className={`${inputClass} appearance-none pr-8`}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary">
            <Icon name="chevronDown" size={14} strokeWidth={2.2} />
          </span>
        </div>
      );

    case "number":
      return (
        <input
          type="number"
          value={value == null || value === "" ? "" : Number(value)}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className={inputClass}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "list":
      return (
        <input
          type="text"
          value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          placeholder={field.placeholder}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((part) => part.trim())
                .filter(Boolean)
            )
          }
          className={inputClass}
        />
      );

    case "text":
      return (
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    default:
      // Toggles are laid out as a row by ConfigForm, not through Control.
      return null;
  }
}

export default function ConfigForm({
  fields,
  config,
  onChange,
}: {
  fields: ConfigField[];
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {fields.map((field) =>
        field.kind === "toggle" ? (
          <div key={field.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-medium">{field.label}</div>
              {field.help && (
                <div className="text-[11px] text-tertiary">{field.help}</div>
              )}
            </div>
            <Toggle
              checked={Boolean(config[field.key])}
              onChange={(v) => onChange(field.key, v)}
              label={field.label}
            />
          </div>
        ) : (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-secondary">
              {field.label}
            </span>
            <Control
              field={field}
              value={config[field.key]}
              onChange={(v) => onChange(field.key, v)}
            />
            {field.help && (
              <span className="text-[11px] text-tertiary">{field.help}</span>
            )}
          </label>
        )
      )}
    </div>
  );
}
