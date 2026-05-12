"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { WidgetSize, WIDGET_SIZES, ConfigField } from "@/lib/widgets/types";
import { getWidgetById, getAllowedSizes, getConfigFields } from "@/lib/widgets/registry";
import { getRenderer } from "@/app/components/widgets/renderers";
import {
  useDashboard,
  createInstance,
  findFirstFit,
} from "@/lib/storage/dashboard";

const COLS = 5;
const ROWS = 5;

const SIZE_PX: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 110, h: 110 },
  medium: { w: 220, h: 150 },
  large: { w: 330, h: 150 },
};

function ConfigControl({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "w-full rounded-lg bg-white/[0.06] border border-white/10 text-white/90 text-xs px-3 py-2 outline-none focus:border-white/30 focus:bg-white/[0.09] placeholder:text-white/30 transition-colors";

  if (field.kind === "toggle") {
    return (
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-xs text-white/70">{field.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
            value
              ? "bg-blue-500 border-blue-400"
              : "bg-white/10 border-white/20"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform mt-[3px] ml-[3px] ${
              value ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className={base + " appearance-none"}
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
    );
  }

  if (field.kind === "number") {
    return (
      <input
        type="number"
        value={value == null ? "" : String(value)}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className={base}
      />
    );
  }

  if (field.kind === "list") {
    return (
      <input
        type="text"
        value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
        placeholder={field.placeholder ?? "Comma-separated values"}
        onChange={(e) =>
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
        }
        className={base}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  );
}

export default function WidgetDetail({
  widgetId,
  onClose,
}: {
  widgetId: string;
  onClose: () => void;
}) {
  const def = getWidgetById(widgetId);
  const { state, actions } = useDashboard();

  const allowedSizes = getAllowedSizes(widgetId);
  const configFields = getConfigFields(widgetId);
  const accent = def?.meta.accent ?? "#60a5fa";

  const [selectedSize, setSelectedSize] = useState<WidgetSize>(
    allowedSizes[0] ?? "medium"
  );
  const [cfg, setCfg] = useState<Record<string, unknown>>(
    (def?.defaultConfig as Record<string, unknown>) ?? {}
  );
  const [display, setDisplay] = useState<unknown>(null);
  const [status, setStatus] = useState<"idle" | "added" | "full">("idle");

  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!def) return;
    let cancelled = false;
    def
      .fetchData(cfg as never, { now: new Date() })
      .then((data) => {
        if (cancelled) return;
        setDisplay(def.toDisplay ? def.toDisplay(data) : data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [def, cfg]);

  const installedCount =
    state?.instances.filter((i) => i.widgetId === widgetId).length ?? 0;

  const canAdd = useCallback(() => {
    if (!state) return true;
    const span = WIDGET_SIZES[selectedSize];
    const taken = state.instances.map((i) => i.position);
    const cols = state.preferences.gridCols ?? COLS;
    const rows = state.preferences.gridRows ?? ROWS;
    return findFirstFit(taken, span.w, span.h, cols, rows) !== null;
  }, [state, selectedSize]);

  const handleAdd = useCallback(() => {
    if (!state) return;
    const span = WIDGET_SIZES[selectedSize];
    const taken = state.instances.map((i) => i.position);
    const cols = state.preferences.gridCols ?? COLS;
    const rows = state.preferences.gridRows ?? ROWS;
    const pos = findFirstFit(taken, span.w, span.h, cols, rows);
    if (!pos) {
      setStatus("full");
      return;
    }
    const instance = createInstance(widgetId, {
      size: selectedSize,
      position: { ...pos, ...span },
      config: cfg,
    });
    actions.addInstance(instance);
    setStatus("added");
    setTimeout(() => onClose(), 1200);
  }, [state, selectedSize, cfg, widgetId, actions, onClose]);

  if (!def) return null;

  const fits = canAdd();
  const Renderer = getRenderer(widgetId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="animate-in relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1120] border border-white/10 shadow-2xl flex flex-col">
        {/* accent glow */}
        <div
          className="pointer-events-none absolute -top-16 -left-10 h-40 w-48 rounded-full blur-3xl opacity-30"
          style={{ background: accent }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/[0.08]">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white leading-tight">
              {def.meta.name}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mt-0.5">
              {def.meta.category ?? "information"}
            </p>
          </div>
          {installedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              Installed ×{installedCount}
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-2 h-7 w-7 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors text-xs font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 px-6 py-5 flex flex-col gap-6">
          {/* Description */}
          {(def.meta.description || def.meta.summary) && (
            <div className="flex flex-col gap-1">
              {def.meta.summary && (
                <p className="text-sm text-white/80 leading-relaxed">
                  {def.meta.summary}
                </p>
              )}
              {def.meta.description && def.meta.description !== def.meta.summary && (
                <p className="text-xs text-white/50 leading-relaxed">
                  {def.meta.description}
                </p>
              )}
            </div>
          )}

          {/* Size previews */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-3">
              Choose size
            </p>
            <div className="flex flex-wrap gap-4 items-end">
              {allowedSizes.map((sz) => {
                const px = SIZE_PX[sz];
                const active = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`relative rounded-xl overflow-hidden border transition-all flex-shrink-0 focus-visible:outline-none ${
                      active
                        ? "border-white/40 shadow-lg"
                        : "border-white/10 hover:border-white/20"
                    }`}
                    style={{
                      width: px.w,
                      height: px.h,
                      background: active
                        ? `radial-gradient(circle at 20% 20%, ${accent}22, transparent 70%), rgba(255,255,255,0.06)`
                        : "rgba(255,255,255,0.04)",
                      boxShadow: active ? `0 0 20px ${accent}30` : undefined,
                    }}
                  >
                    <div className="absolute inset-0 p-3 flex items-center justify-center pointer-events-none">
                      <Renderer data={display} size={sz} />
                    </div>
                    <div
                      className={`absolute bottom-1.5 left-0 right-0 flex justify-center`}
                    >
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-white/[0.08] text-white/50"
                        }`}
                      >
                        {sz}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Config fields */}
          {configFields.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-3">
                Configuration
              </p>
              <div className="flex flex-col gap-3">
                {configFields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    {field.kind !== "toggle" && (
                      <label className="text-xs text-white/60 font-medium">
                        {field.label}
                      </label>
                    )}
                    <ConfigControl
                      field={field}
                      value={cfg[field.key]}
                      onChange={(v) =>
                        setCfg((prev) => ({ ...prev, [field.key]: v }))
                      }
                    />
                    {field.help && (
                      <p className="text-[10px] text-white/30">{field.help}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full warning */}
          {!fits && status !== "added" && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <p className="text-xs text-amber-300">
                Your dashboard is full — remove a widget or expand the grid first.
              </p>
            </div>
          )}

          {/* Success */}
          {status === "added" && (
            <div className="animate-in rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
              <p className="text-xs text-emerald-300 font-medium">
                Added to your dashboard!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {installedCount > 0 && status !== "added" && (
              <button
                onClick={handleAdd}
                disabled={!fits}
                className="rounded-lg border border-white/15 bg-white/[0.08] hover:bg-white/[0.12] px-4 py-2 text-xs font-semibold text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add another
              </button>
            )}
            <button
              onClick={handleAdd}
              disabled={!fits || status === "added"}
              className="rounded-lg px-5 py-2 text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: fits
                  ? `linear-gradient(135deg, ${accent}cc, ${accent}88)`
                  : undefined,
                backgroundColor: fits ? undefined : "rgba(255,255,255,0.1)",
                boxShadow: fits ? `0 4px 16px ${accent}40` : undefined,
              }}
            >
              {status === "added" ? "Added!" : "Add to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
