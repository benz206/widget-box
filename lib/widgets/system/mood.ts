import { WidgetDefinition } from "../types";

type MoodCfg = { vibe?: string };
type MoodData = { label: string; emoji: string; color: string; gradient: [string, string] };

const MOODS = [
  { label: "Dreamy", emoji: "🌙", color: "#a78bfa", gradient: ["#312e81", "#7c3aed"] as [string, string] },
  { label: "Rising", emoji: "🌅", color: "#fb923c", gradient: ["#fb7185", "#fbbf24"] as [string, string] },
  { label: "Bright", emoji: "☀️", color: "#facc15", gradient: ["#fbbf24", "#fde68a"] as [string, string] },
  { label: "Focused", emoji: "🎯", color: "#60a5fa", gradient: ["#1d4ed8", "#22d3ee"] as [string, string] },
  { label: "Mellow", emoji: "🍵", color: "#34d399", gradient: ["#065f46", "#34d399"] as [string, string] },
  { label: "Cozy", emoji: "🕯️", color: "#f97316", gradient: ["#9a3412", "#fb923c"] as [string, string] },
];

export const moodWidget: WidgetDefinition<MoodCfg, MoodData> = {
  meta: {
    id: "system.mood",
    slug: "mood",
    name: "Mood Ring",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Vibe of the hour",
    refreshIntervalSeconds: 600,
    category: "ambient",
    tags: ["mood", "ambient"],
    accent: "#a78bfa",
    allowedSizes: ["small", "medium"],
    summary: "A gradient that shifts with your mood",
  },
  defaultConfig: { vibe: "auto" },
  configFields: [
    { kind: "select", key: "vibe", label: "Vibe", options: [{ value: "auto", label: "Auto" }, { value: "calm", label: "Calm" }, { value: "energetic", label: "Energetic" }, { value: "focus", label: "Focus" }] },
  ],
  async fetchData(_cfg, ctx) {
    const h = ctx.now.getHours();
    let idx = 0;
    if (h < 5) idx = 0;
    else if (h < 8) idx = 1;
    else if (h < 12) idx = 2;
    else if (h < 16) idx = 3;
    else if (h < 20) idx = 4;
    else idx = 5;
    return MOODS[idx];
  },
  toDisplay(d) {
    return d;
  },
};
