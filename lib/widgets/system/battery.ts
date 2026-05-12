import { WidgetDefinition } from "../types";

type BatCfg = Record<string, never>;
type BatData = { percent: number; charging: boolean; deviceName: string };

export const batteryWidget: WidgetDefinition<BatCfg, BatData> = {
  meta: {
    id: "system.battery",
    slug: "battery",
    name: "Batteries",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Battery levels for devices",
    refreshIntervalSeconds: 120,
    category: "information",
    tags: ["system", "power"],
    accent: "#34d399",
    allowedSizes: ["small", "medium"],
    summary: "Battery level for your active device",
  },
  defaultConfig: {},
  async fetchData(_cfg, ctx) {
    // simulated drift across the day
    const minutes = ctx.now.getHours() * 60 + ctx.now.getMinutes();
    const percent = Math.max(10, 100 - ((minutes / 14) | 0));
    return { percent, charging: ctx.now.getHours() % 6 === 0, deviceName: "MacBook" };
  },
  toDisplay(d) {
    return d;
  },
};
