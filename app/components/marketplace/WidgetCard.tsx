"use client";

import TilePreview from "@/app/components/widgets/TilePreview";
import Icon from "@/app/components/ui/Icon";
import type { WidgetDefinition } from "@/lib/widgets/types";

export default function WidgetCard({
  definition,
  installedCount,
  onSelect,
}: {
  definition: WidgetDefinition;
  installedCount: number;
  onSelect: () => void;
}) {
  const { meta } = definition;
  const previewSize = meta.sizes.includes("small") ? "small" : meta.sizes[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="press focus-ring material hairline group flex flex-col gap-3 rounded-card p-4 text-left"
      style={{ boxShadow: "var(--tile-shadow)" }}
    >
      <div className="flex h-[170px] items-center justify-center overflow-hidden rounded-[14px] bg-fill">
        <TilePreview widgetId={meta.id} size={previewSize} cell={138} />
      </div>

      <div className="flex items-start gap-2.5">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
          style={{ background: `${meta.accent}1f`, color: meta.accent }}
        >
          <Icon name={meta.icon} size={17} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">
              {meta.name}
            </h3>
            {installedCount > 0 && (
              <span
                className="flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "color-mix(in srgb, var(--positive) 16%, transparent)",
                  color: "var(--positive)",
                }}
              >
                <Icon name="check" size={9} strokeWidth={3} />
                {installedCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-secondary">
            {meta.tagline}
          </p>
        </div>
      </div>
    </button>
  );
}
