import Badge from "@/app/components/ui/Badge";
import Icon from "@/app/components/ui/Icon";
import { getWidgetById } from "@/lib/widgets/registry";

export default function StepFinish({
  widgetIds,
  displayName,
  dropped,
}: {
  widgetIds: string[];
  displayName?: string;
  /** Widgets that would not fit on the grid. */
  dropped: string[];
}) {
  const placed = widgetIds.length - dropped.length;

  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="success-mark">
          <Icon name="check" size={16} strokeWidth={2.4} />
        </span>
        <div>
          <h2 className="step-title">
            {displayName ? `You're set, ${displayName}` : "You're all set"}
          </h2>
          <p className="step-description">
            {placed} of {widgetIds.length} widget{widgetIds.length === 1 ? "" : "s"} fit on your grid.
          </p>
        </div>
      </div>

      {widgetIds.length > 0 && (
        <ul className="card mt-6 divide-y divide-separator">
          {widgetIds.map((id) => {
            const meta = getWidgetById(id)?.meta;
            if (!meta) return null;
            const skipped = dropped.includes(id);
            return (
              <li key={id} className="flex items-center gap-3 px-4 py-3">
                <span className="icon-tile icon-tile-sm" style={{ ["--tile-accent" as string]: meta.accent }}>
                  <Icon name={meta.icon} size={14} />
                </span>
                <span className="flex-1 truncate text-[13px] font-medium">{meta.name}</span>
                {skipped ? (
                  <Badge tone="warning" dot>Didn&apos;t fit</Badge>
                ) : (
                  <Badge tone="positive" dot>Placed</Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {dropped.length > 0 && (
        <p className="field-hint mt-3">
          Add the ones that didn&apos;t fit from the widget library once you have made room.
        </p>
      )}
    </div>
  );
}
