"use client";

import Icon from "@/app/components/ui/Icon";
import { CATEGORY_LABELS, getWidgetById, listByCategory } from "@/lib/widgets/registry";

export const PRESETS = [
  {
    id: "essentials",
    name: "Essentials",
    description: "Time, weather, and the date",
    widgetIds: ["system.clock", "system.weather", "system.calendar"],
  },
  {
    id: "focus",
    name: "Focus",
    description: "A timer, a scratchpad, a deadline",
    widgetIds: [
      "system.pomodoro",
      "system.notes",
      "system.clock",
      "system.countdown",
    ],
  },
  {
    id: "markets",
    name: "Markets",
    description: "Prices first, everything else after",
    widgetIds: ["system.stocks", "system.clock", "system.weather"],
  },
  {
    id: "wellbeing",
    name: "Wellbeing",
    description: "Rings, mood, and the sky",
    widgetIds: [
      "system.fitness",
      "system.mood",
      "system.affirmation",
      "system.astronomy",
    ],
  },
  {
    id: "custom",
    name: "Build your own",
    description: "Pick from everything",
    widgetIds: [] as string[],
  },
] as const;

export type PresetId = (typeof PRESETS)[number]["id"];

export default function StepPreset({
  presetId,
  selected,
  onPickPreset,
  onToggleWidget,
}: {
  presetId: PresetId | null;
  selected: string[];
  onPickPreset: (id: PresetId, widgetIds: string[]) => void;
  onToggleWidget: (widgetId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight">
          Choose a starting point
        </h2>
        <p className="mt-1 text-[14px] text-secondary">
          You can add, remove, and rearrange everything later.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {PRESETS.map((preset) => {
          const active = presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPickPreset(preset.id, [...preset.widgetIds])}
              className="press focus-ring hairline flex flex-col gap-2.5 rounded-card p-4 text-left"
              style={
                active
                  ? {
                      borderColor: "var(--accent)",
                      background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                      boxShadow: "0 0 0 1px var(--accent)",
                    }
                  : { background: "var(--fill)" }
              }
            >
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">{preset.name}</span>
                {active && (
                  <span className="ml-auto text-accent">
                    <Icon name="check" size={15} strokeWidth={2.6} />
                  </span>
                )}
              </div>
              <p className="text-[12.5px] text-secondary">{preset.description}</p>
              <div className="flex gap-1.5">
                {preset.widgetIds.length > 0 ? (
                  preset.widgetIds.map((id) => {
                    const meta = getWidgetById(id)?.meta;
                    if (!meta) return null;
                    return (
                      <span
                        key={id}
                        title={meta.name}
                        className="flex h-7 w-7 items-center justify-center rounded-[8px]"
                        style={{ background: `${meta.accent}24`, color: meta.accent }}
                      >
                        <Icon name={meta.icon} size={15} strokeWidth={2} />
                      </span>
                    );
                  })
                ) : (
                  <span className="text-[12px] text-tertiary">
                    Any combination you like
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {presetId === "custom" && (
        <div className="flex flex-col gap-5">
          {listByCategory().map(([category, definitions]) => (
            <div key={category}>
              <div className="mb-2 text-[12px] font-semibold text-secondary">
                {CATEGORY_LABELS[category]}
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {definitions.map(({ meta }) => {
                  const checked = selected.includes(meta.id);
                  return (
                    <button
                      key={meta.id}
                      type="button"
                      onClick={() => onToggleWidget(meta.id)}
                      className="press focus-ring flex items-center gap-2.5 rounded-control px-3 py-2 text-left"
                      style={{
                        background: checked
                          ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                          : "var(--fill)",
                      }}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
                        style={{ background: `${meta.accent}24`, color: meta.accent }}
                      >
                        <Icon name={meta.icon} size={15} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium">
                          {meta.name}
                        </span>
                        <span className="block truncate text-[11.5px] text-tertiary">
                          {meta.tagline}
                        </span>
                      </span>
                      {checked && (
                        <span className="shrink-0 text-accent">
                          <Icon name="check" size={15} strokeWidth={2.6} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
