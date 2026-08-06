"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConfigForm from "@/app/components/ui/ConfigForm";
import Icon from "@/app/components/ui/Icon";
import Segmented from "@/app/components/ui/Segmented";
import TilePreview from "@/app/components/widgets/TilePreview";
import {
  createInstance,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  findFirstFit,
  type DashboardActions,
  type DashboardState,
} from "@/lib/storage/dashboard";
import { getWidgetById } from "@/lib/widgets/registry";
import { SIZE_LABELS, WIDGET_SIZES, type WidgetSize } from "@/lib/widgets/types";

export default function WidgetDetail({
  widgetId,
  state,
  actions,
  onClose,
}: {
  widgetId: string;
  state: DashboardState | null;
  actions: DashboardActions;
  onClose: () => void;
}) {
  const definition = getWidgetById(widgetId);
  const [size, setSize] = useState<WidgetSize>(
    definition?.meta.defaultSize ?? "small"
  );
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => ({ ...(definition?.defaultConfig ?? {}) })
  );
  const [added, setAdded] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const cols = state?.preferences.gridCols ?? DEFAULT_COLS;
  const rows = state?.preferences.gridRows ?? DEFAULT_ROWS;
  const span = WIDGET_SIZES[size];
  const spot = findFirstFit(
    state?.instances.map((i) => i.position) ?? [],
    span.w,
    span.h,
    cols,
    rows
  );

  const add = useCallback(() => {
    if (!spot) return;
    actions.addInstance(createInstance(widgetId, { size, position: spot, config }));
    setAdded(true);
    setTimeout(onClose, 900);
  }, [spot, actions, widgetId, size, config, onClose]);

  if (!definition) return null;
  const { meta } = definition;
  const installed =
    state?.instances.filter((i) => i.widgetId === widgetId).length ?? 0;

  return (
    <div
      ref={backdropRef}
      onPointerDown={(e) => e.target === backdropRef.current && onClose()}
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}
    >
      <div
        role="dialog"
        aria-label={meta.name}
        className="animate-sheet-in hairline flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[20px]"
        style={{
          background: "var(--elevated-solid)",
          boxShadow: "var(--tile-shadow-lifted)",
        }}
      >
        <header className="flex items-center gap-3 border-b border-separator px-5 py-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: `${meta.accent}1f`, color: meta.accent }}
          >
            <Icon name={meta.icon} size={19} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-semibold tracking-tight">
              {meta.name}
            </h2>
            <p className="truncate text-[12.5px] text-secondary">{meta.tagline}</p>
          </div>
          {installed > 0 && (
            <span
              className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold"
              style={{
                background: "color-mix(in srgb, var(--positive) 16%, transparent)",
                color: "var(--positive)",
              }}
            >
              {installed} added
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fill text-secondary"
          >
            <Icon name="xmark" size={13} strokeWidth={2.4} />
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5">
          <p className="text-[14px] leading-relaxed text-secondary">
            {meta.description}
          </p>

          <div className="flex flex-col gap-3">
            {meta.sizes.length > 1 && (
              <Segmented
                options={meta.sizes.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
                value={size}
                onChange={setSize}
                size="sm"
              />
            )}
            <div className="flex min-h-[190px] items-center justify-center rounded-[16px] bg-fill p-5">
              <TilePreview widgetId={widgetId} size={size} cell={124} config={config} />
            </div>
          </div>

          {(definition.configFields?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] font-semibold text-secondary">Settings</h3>
              <ConfigForm
                fields={definition.configFields ?? []}
                config={config}
                onChange={(key, value) =>
                  setConfig((prev) => ({ ...prev, [key]: value }))
                }
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-fill px-2.5 py-1 text-[11px] font-medium text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          {!spot && (
            <p
              className="rounded-control px-3.5 py-2.5 text-[12.5px]"
              style={{
                background: "color-mix(in srgb, var(--warning) 14%, transparent)",
                color: "var(--warning)",
              }}
            >
              Your dashboard is full at this size. Remove a widget or pick a
              smaller one.
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-separator px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="press focus-ring rounded-full px-4 py-2 text-[14px] font-medium text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={add}
            disabled={!spot || added}
            className="press focus-ring flex items-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-40"
            style={{ background: added ? "var(--positive)" : "var(--accent)" }}
          >
            <Icon name={added ? "check" : "plus"} size={15} strokeWidth={2.4} />
            {added ? "Added" : installed > 0 ? "Add another" : "Add widget"}
          </button>
        </footer>
      </div>
    </div>
  );
}
