"use client";
import { useEffect, useRef, useState } from "react";
import { ConfigField, WidgetSize } from "@/lib/widgets/types";

type Props = {
  widgetId: string;
  instanceId: string;
  title: string;
  accent: string;
  size: WidgetSize;
  config: Record<string, unknown>;
  fields: ConfigField[];
  allowedSizes: WidgetSize[];
  position: { x: number; y: number };
  onSizeChange: (size: WidgetSize) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onClose: () => void;
};

const SIZE_LABELS: Record<WidgetSize, string> = {
  small: "S",
  medium: "M",
  large: "L",
};

export default function WidgetSettingsPanel({
  title,
  accent,
  size,
  config,
  fields,
  allowedSizes,
  position,
  onSizeChange,
  onConfigChange,
  onRemove,
  onDuplicate,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PANEL_W = 320;
  const PANEL_H_EST = 400;
  const left = Math.min(position.x + 8, (typeof window !== "undefined" ? window.innerWidth : 1200) - PANEL_W - 16);
  const top = Math.min(position.y + 8, (typeof window !== "undefined" ? window.innerHeight : 800) - PANEL_H_EST - 16);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, []);

  function handleRemoveClick() {
    if (removeConfirm) {
      onRemove();
      onClose();
    } else {
      setRemoveConfirm(true);
      removeTimer.current = setTimeout(() => setRemoveConfirm(false), 3000);
    }
  }

  function setField(key: string, value: unknown) {
    onConfigChange({ ...config, [key]: value });
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-[200] w-80 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl animate-in fade-in text-sm"
      style={{ left, top }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-white/10">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
        <span className="flex-1 font-semibold text-white truncate">{title} settings</span>
        <button
          onClick={onClose}
          className="h-5 w-5 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors text-xs"
          onPointerDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Size section */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Size</div>
          <div className="flex gap-2">
            {allowedSizes.map((s) => (
              <button
                key={s}
                onClick={() => onSizeChange(s)}
                onPointerDown={(e) => e.stopPropagation()}
                className={[
                  "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  size === s
                    ? "bg-white/20 border-white/30 text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80",
                ].join(" ")}
              >
                {SIZE_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>

        {/* Config fields */}
        {fields.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Configuration</div>
            <div className="space-y-3">
              {fields.map((f) => (
                <FieldRow key={f.key} field={f} config={config} setField={setField} />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-white/10 pt-3 flex gap-2">
          <button
            onClick={() => { onDuplicate(); onClose(); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Duplicate
          </button>
          <button
            onClick={handleRemoveClick}
            onPointerDown={(e) => e.stopPropagation()}
            className={[
              "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              removeConfirm
                ? "bg-red-500/20 border-red-500/40 text-red-300"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300",
            ].join(" ")}
          >
            {removeConfirm ? "Click again to remove" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  config,
  setField,
}: {
  field: ConfigField;
  config: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
}) {
  const inputClass =
    "w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 text-xs focus:outline-none focus:ring-1 focus:ring-white/30";

  if (field.kind === "toggle") {
    return (
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={Boolean(config[field.key])}
          onChange={(e) => setField(field.key, e.target.checked)}
          className="w-4 h-4 rounded border-2 border-white/30 bg-transparent accent-blue-400"
          onPointerDown={(e) => e.stopPropagation()}
        />
        <div className="flex flex-col">
          <span className="text-xs text-white/80 group-hover:text-white">{field.label}</span>
          {field.help && <span className="text-[10px] text-white/40">{field.help}</span>}
        </div>
      </label>
    );
  }

  if (field.kind === "list") {
    const val = Array.isArray(config[field.key])
      ? (config[field.key] as string[]).join(", ")
      : String(config[field.key] ?? "");
    return (
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-white/50">{field.label}</div>
        <input
          className={inputClass}
          placeholder={field.placeholder}
          value={val}
          onChange={(e) =>
            setField(
              field.key,
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          onPointerDown={(e) => e.stopPropagation()}
        />
        {field.help && <div className="text-[10px] text-white/40">{field.help}</div>}
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-white/50">{field.label}</div>
        <select
          className={inputClass + " bg-black/40"}
          value={String(config[field.key] ?? "")}
          onChange={(e) => setField(field.key, e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {field.placeholder && (
            <option value="" disabled>
              {field.placeholder}
            </option>
          )}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {field.help && <div className="text-[10px] text-white/40">{field.help}</div>}
      </div>
    );
  }

  if (field.kind === "number") {
    return (
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-white/50">{field.label}</div>
        <input
          type="number"
          className={inputClass}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          value={config[field.key] !== undefined ? Number(config[field.key]) : ""}
          onChange={(e) => setField(field.key, e.target.valueAsNumber)}
          onPointerDown={(e) => e.stopPropagation()}
        />
        {field.help && <div className="text-[10px] text-white/40">{field.help}</div>}
      </div>
    );
  }

  // text (default)
  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{field.label}</div>
      <input
        type="text"
        className={inputClass}
        placeholder={field.placeholder}
        value={String(config[field.key] ?? "")}
        onChange={(e) => setField(field.key, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
      />
      {field.help && <div className="text-[10px] text-white/40">{field.help}</div>}
    </div>
  );
}
