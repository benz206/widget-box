import { WidgetDefinition } from "../types";

type FitCfg = Record<string, never>;
type FitData = {
  move: { value: number; goal: number };
  exercise: { value: number; goal: number };
  stand: { value: number; goal: number };
};

export const fitnessWidget: WidgetDefinition<FitCfg, FitData> = {
  meta: {
    id: "system.fitness",
    slug: "fitness",
    name: "Activity",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Move / Exercise / Stand rings",
    refreshIntervalSeconds: 300,
    category: "lifestyle",
    tags: ["health", "activity"],
    accent: "#22d3ee",
    summary: "Daily move, exercise, and stand rings",
  },
  defaultConfig: {},
  async fetchData(_cfg, ctx) {
    const dayProgress = (ctx.now.getHours() * 60 + ctx.now.getMinutes()) / (24 * 60);
    return {
      move: { value: Math.round(540 * dayProgress + 80), goal: 600 },
      exercise: { value: Math.round(30 * dayProgress + 5), goal: 30 },
      stand: { value: Math.min(12, Math.round(12 * dayProgress + 1)), goal: 12 },
    };
  },
  toDisplay(d) {
    return d;
  },
};
