import TilePreview from "@/app/components/widgets/TilePreview";
import Badge from "@/app/components/ui/Badge";
import { CATEGORY_LABELS } from "@/lib/widgets/registry";
import type { WidgetDefinition } from "@/lib/widgets/types";
import SizeChips from "./SizeChips";

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
    <article className="library-card card" style={{ ["--tile-accent" as string]: meta.accent }}>
      <div className="library-preview preview-surface">
        <TilePreview widgetId={meta.id} size={previewSize} cell={132} />
      </div>
      <div className="library-card-body">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[14px] font-semibold">
            <button type="button" onClick={onSelect} className="card-link focus-ring">
              {meta.name}
            </button>
          </h3>
          {installedCount > 0 && (
            <Badge tone="positive" dot>
              {installedCount} added
            </Badge>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-secondary">{meta.tagline}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-secondary">
          <span>{CATEGORY_LABELS[meta.category]}</span>
          <SizeChips sizes={meta.sizes} />
        </div>
      </div>
    </article>
  );
}
