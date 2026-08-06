"use client";

import { listByCategory } from "@/lib/widgets/registry";
import PresetCard from "./PresetCard";

export const PRESETS = [
  {
    id: "essentials",
    name: "Essentials",
    description: "The basics for any day",
    widgetIds: ["system.clock", "system.weather", "system.calendar"],
    accent: "#60a5fa",
  },
  {
    id: "productive",
    name: "Productive",
    description: "Focus, time, and tasks",
    widgetIds: ["system.clock", "system.calendar", "system.pomodoro", "system.battery"],
    accent: "#f97316",
  },
  {
    id: "wellness",
    name: "Wellness",
    description: "Mind, body, and mood",
    widgetIds: ["system.fitness", "system.affirmation", "system.mood", "system.astronomy"],
    accent: "#22d3ee",
  },
  {
    id: "trader",
    name: "Trader",
    description: "Markets at a glance",
    widgetIds: ["system.clock", "system.stocks", "system.weather", "system.battery"],
    accent: "#a78bfa",
  },
  {
    id: "ambient",
    name: "Ambient",
    description: "Just the vibes",
    widgetIds: ["system.mood", "system.affirmation", "system.astronomy", "system.pixelpet"],
    accent: "#a78bfa",
  },
  {
    id: "custom",
    name: "Build your own",
    description: "Pick widgets one by one",
    widgetIds: [],
    accent: "#94a3b8",
  },
] as const;

type StepPresetProps = {
  presetId: string | null;
  selectedWidgets: string[];
  onChange: (id: string, widgetIds: string[]) => void;
  onCustomToggle: (widgetId: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  productivity: "Productivity",
  information: "Information",
  lifestyle: "Lifestyle",
  finance: "Finance",
  fun: "Fun",
  ambient: "Ambient",
};

export default function StepPreset({ presetId, selectedWidgets, onChange, onCustomToggle }: StepPresetProps) {
  const byCategory = listByCategory();
  const isCustom = presetId === "custom";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Choose a starting point</h2>
        <p className="text-white/50 text-sm">Pick a preset or build your own widget mix.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            id={preset.id}
            name={preset.name}
            description={preset.description}
            widgetIds={[...preset.widgetIds]}
            accent={preset.accent}
            selected={presetId === preset.id}
            onSelect={() => onChange(preset.id, [...preset.widgetIds])}
          />
        ))}
      </div>

      {isCustom && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Select widgets</h3>
          <div className="flex flex-col gap-5">
            {Object.entries(byCategory).map(([cat, defs]) => {
              if (!defs.length) return null;
              return (
                <div key={cat}>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {defs.map((def) => {
                      const checked = selectedWidgets.includes(def.meta.id);
                      return (
                        <label
                          key={def.meta.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.05] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onCustomToggle(def.meta.id)}
                            className="accent-blue-400 h-3.5 w-3.5 rounded shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-white/80">{def.meta.name}</span>
                            {def.meta.description && (
                              <span className="text-[10px] text-white/40">{def.meta.description}</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
