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
    <div>
      <h2 className="step-title">Choose a starting point</h2>
      <p className="step-description">
        You can add, remove, and rearrange everything later.
      </p>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-pressed={presetId === preset.id}
            onClick={() => onPickPreset(preset.id, [...preset.widgetIds])}
            className="choice-card focus-ring"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">{preset.name}</span>
              <span className="radio" aria-hidden />
            </span>
            <span className="text-[12px] text-secondary">{preset.description}</span>
            <span className="mt-1 flex gap-1">
              {preset.widgetIds.length > 0 ? (
                preset.widgetIds.map((id) => {
                  const meta = getWidgetById(id)?.meta;
                  if (!meta) return null;
                  return (
                    <span
                      key={id}
                      title={meta.name}
                      className="icon-tile icon-tile-sm"
                      style={{ ["--tile-accent" as string]: meta.accent }}
                    >
                      <Icon name={meta.icon} size={14} />
                    </span>
                  );
                })
              ) : (
                <span className="text-[12px] leading-6 text-secondary">
                  Any combination you like
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {presetId === "custom" && (
        <div className="mt-6 flex flex-col gap-4">
          {listByCategory().map(([category, definitions]) => (
            <div key={category}>
              <h3 className="mb-2 text-[12px] font-medium text-secondary">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="card divide-y divide-separator overflow-hidden">
                {definitions.map(({ meta }) => {
                  const checked = selected.includes(meta.id);
                  return (
                    <button
                      key={meta.id}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => onToggleWidget(meta.id)}
                      className="check-row focus-ring"
                    >
                      <span className="checkbox" aria-hidden>
                        {checked && <Icon name="check" size={12} strokeWidth={2.6} />}
                      </span>
                      <span
                        className="icon-tile icon-tile-sm"
                        style={{ ["--tile-accent" as string]: meta.accent }}
                      >
                        <Icon name={meta.icon} size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {meta.name}
                        </span>
                        <span className="block truncate text-[12px] text-secondary">
                          {meta.tagline}
                        </span>
                      </span>
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
