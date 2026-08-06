"use client";

import { getWidgetById, resolveConfig } from "@/lib/widgets/registry";
import { WIDGET_SIZES, type WidgetSize } from "@/lib/widgets/types";

const GAP = 16;

/**
 * A widget rendered exactly as it appears on the dashboard, at a chosen cell
 * size. Contents are inert — a preview is for looking at, not using.
 */
export default function TilePreview({
  widgetId,
  size,
  cell,
  config,
}: {
  widgetId: string;
  size: WidgetSize;
  cell: number;
  config?: Record<string, unknown>;
}) {
  const definition = getWidgetById(widgetId);
  if (!definition) return null;

  const span = WIDGET_SIZES[size];
  const { View } = definition;

  return (
    <div
      className="material hairline rounded-tile squircle relative overflow-hidden"
      style={{
        width: span.w * cell + (span.w - 1) * GAP,
        height: span.h * cell + (span.h - 1) * GAP,
        ["--tile-pad" as string]: "16px",
        padding: "var(--tile-pad)",
        boxShadow: "var(--tile-shadow)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "var(--tile-highlight)" }}
      />
      <div className="relative h-full w-full" inert>
        <View
          instanceId={`preview:${widgetId}:${size}`}
          size={size}
          config={resolveConfig(widgetId, config ?? {})}
        />
      </div>
    </div>
  );
}
