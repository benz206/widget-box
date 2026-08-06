"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ConfigForm from "./ui/ConfigForm";
import Icon from "./ui/Icon";
import Segmented from "./ui/Segmented";
import { getConfigFields, getWidgetById } from "@/lib/widgets/registry";
import { SIZE_LABELS, type WidgetSize } from "@/lib/widgets/types";

const WIDTH = 300;
const MARGIN = 12;

type Props = {
  widgetId: string;
  size: WidgetSize;
  config: Record<string, unknown>;
  anchor: { x: number; y: number };
  onSizeChange: (size: WidgetSize) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onClose: () => void;
};

export default function WidgetSettingsPanel({
  widgetId,
  size,
  config,
  anchor,
  onSizeChange,
  onConfigChange,
  onRemove,
  onDuplicate,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState({ left: anchor.x, top: anchor.y });
  const definition = getWidgetById(widgetId);
  const fields = getConfigFields(widgetId);

  // Keep the popover fully on screen, flipping above the anchor if needed.
  useLayoutEffect(() => {
    const height = panelRef.current?.offsetHeight ?? 320;
    setPlacement({
      left: Math.max(
        MARGIN,
        Math.min(anchor.x - WIDTH, window.innerWidth - WIDTH - MARGIN)
      ),
      top:
        anchor.y + height + MARGIN > window.innerHeight
          ? Math.max(MARGIN, window.innerHeight - height - MARGIN)
          : anchor.y + 6,
    });
  }, [anchor.x, anchor.y]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (!definition) return null;
  const sizes = definition.meta.sizes;

  // Portalled to the body: while the dashboard is in edit mode the tile's
  // contents are inert, and a popover nested inside would inherit that.
  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`${definition.meta.name} settings`}
      className="animate-sheet-in material hairline fixed z-[200] flex flex-col rounded-card"
      style={{
        left: placement.left,
        top: placement.top,
        width: WIDTH,
        maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
        boxShadow: "var(--tile-shadow-lifted)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <header className="flex items-center gap-2 border-b border-separator px-4 py-3">
        <span style={{ color: definition.meta.accent }}>
          <Icon name={definition.meta.icon} size={15} strokeWidth={2} />
        </span>
        <h2 className="flex-1 truncate text-[14px] font-semibold">
          {definition.meta.name}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="press focus-ring flex h-6 w-6 items-center justify-center rounded-full bg-fill text-secondary"
        >
          <Icon name="xmark" size={12} strokeWidth={2.4} />
        </button>
      </header>

      <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
        {sizes.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-secondary">Size</span>
            <Segmented
              options={sizes.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
              value={size}
              onChange={onSizeChange}
              size="sm"
              className="w-full"
            />
          </div>
        )}

        {fields.length > 0 && (
          <ConfigForm
            fields={fields}
            config={config}
            onChange={(key, value) => onConfigChange({ ...config, [key]: value })}
          />
        )}
      </div>

      <footer className="flex gap-2 border-t border-separator px-4 py-3">
        <button
          type="button"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          className="press focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-control bg-fill py-2 text-[13px] font-medium"
        >
          <Icon name="duplicate" size={14} />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => {
            onRemove();
            onClose();
          }}
          className="press focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-control py-2 text-[13px] font-medium text-negative"
          style={{ background: "color-mix(in srgb, var(--negative) 12%, transparent)" }}
        >
          <Icon name="trash" size={14} />
          Remove
        </button>
      </footer>
    </div>,
    document.body
  );
}
