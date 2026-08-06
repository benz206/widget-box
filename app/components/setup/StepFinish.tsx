"use client";

import Icon from "@/app/components/ui/Icon";
import { getWidgetById } from "@/lib/widgets/registry";

export default function StepFinish({
  widgetIds,
  displayName,
  dropped,
  onFinish,
}: {
  widgetIds: string[];
  displayName?: string;
  /** Widgets that would not fit on the grid. */
  dropped: string[];
  onFinish: () => void;
}) {
  const placed = widgetIds.length - dropped.length;

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span
        className="mb-6 flex h-[68px] w-[68px] items-center justify-center rounded-full text-white"
        style={{
          background: "var(--positive)",
          boxShadow: "0 10px 30px color-mix(in srgb, var(--positive) 40%, transparent)",
        }}
      >
        <Icon name="check" size={32} strokeWidth={2.6} />
      </span>

      <h2 className="text-[28px] font-semibold tracking-tight">
        {displayName ? `You're set, ${displayName}` : "You're all set"}
      </h2>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-secondary">
        {placed} widget{placed === 1 ? "" : "s"} ready to go.
      </p>

      {widgetIds.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {widgetIds.map((id) => {
            const meta = getWidgetById(id)?.meta;
            if (!meta) return null;
            const skipped = dropped.includes(id);
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full bg-fill px-3 py-1.5 text-[12.5px] font-medium"
                style={skipped ? { opacity: 0.45 } : undefined}
              >
                <span style={{ color: meta.accent }}>
                  <Icon name={meta.icon} size={14} strokeWidth={2} />
                </span>
                {meta.name}
              </span>
            );
          })}
        </div>
      )}

      {dropped.length > 0 && (
        <p className="mt-4 max-w-sm text-[12.5px] text-tertiary">
          The dimmed ones did not fit on the grid. Add them from the widget
          library once you have made room.
        </p>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="press focus-ring mt-8 rounded-full px-7 py-3 text-[15px] font-semibold text-white"
        style={{ background: "var(--accent)" }}
      >
        Open dashboard
      </button>
    </div>
  );
}
