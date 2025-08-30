import { WidgetDefinition } from "../types";

type TimeCfg = { timezone?: string };
type TimeData = { iso: string; display: string };

export const timeWidget: WidgetDefinition<TimeCfg, TimeData> = {
  meta: {
    id: "system.time.simple",
    slug: "time.simple",
    name: "Clock",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Shows current time",
    refreshIntervalSeconds: 60,
  },
  async fetchData(config: TimeCfg) {
    const now = new Date();
    const display = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log("config", config);

    return { iso: now.toISOString(), display };
  },
  toDisplay(d) {
    return d;
  },
};


