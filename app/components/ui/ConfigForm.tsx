"use client";

import type { ConfigField } from "@/lib/widgets/types";
import Field from "./Field";

const inputClass = "input";

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
      className="focus-ring relative h-5 w-8 shrink-0 rounded-full"
      style={{
        background: checked ? "var(--accent)" : "var(--fill-tertiary)",
        transition: "background-color 120ms linear",
      }}
    >
      <span
        className="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full bg-white"
        style={{
          transform: checked ? "translateX(12px)" : undefined,
          boxShadow: "0 1px 2px rgba(0,0,0,0.24)",
          transition: "transform 120ms ease-out",
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
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
          className={inputClass}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
    <div className="flex flex-col gap-4">
      {fields.map((field) =>
        field.kind === "toggle" ? (
          <div key={field.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] font-medium">{field.label}</div>
              {field.help && (
                <div className="text-[12px] text-secondary">{field.help}</div>
              )}
            </div>
            <Toggle
              checked={Boolean(config[field.key])}
              onChange={(v) => onChange(field.key, v)}
              label={field.label}
            />
          </div>
        ) : (
          <Field key={field.key} label={field.label} hint={field.help}>
            <Control
              field={field}
              value={config[field.key]}
              onChange={(v) => onChange(field.key, v)}
            />
          </Field>
        )
      )}
    </div>
  );
}
