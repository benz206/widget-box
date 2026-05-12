import { WidgetDefinition } from "../types";

type ClockCfg = { timezone?: string; hour12?: boolean };
type ClockData = {
  time: string;
  hour: string;
  minute: string;
  second: string;
  ampm: string;
  weekday: string;
  date: string;
  tz: string;
};

export const clockWidget: WidgetDefinition<ClockCfg, ClockData> = {
  meta: {
    id: "system.clock",
    slug: "clock",
    name: "Clock",
    provider: "system",
    creator: "widget-box",
    size: "medium",
    description: "Current local time",
    refreshIntervalSeconds: 30,
    category: "productivity",
    tags: ["time", "timezone"],
    accent: "#60a5fa",
    summary: "Always-on local time with timezone support",
  },
  defaultConfig: { hour12: true },
  configFields: [
    { kind: "toggle", key: "hour12", label: "12-hour format" },
    { kind: "text", key: "timezone", label: "Timezone", placeholder: "America/Toronto" },
  ],
  async fetchData(config, ctx) {
    const tz =
      config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hour12 = config.hour12 ?? true;
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12,
      timeZone: tz,
    }).formatToParts(ctx.now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = get("hour");
    const minute = get("minute");
    const second = get("second");
    const ampm = get("dayPeriod");
    const time = hour12 ? `${hour}:${minute}` : `${hour}:${minute}`;
    const weekday = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: tz,
    }).format(ctx.now);
    const date = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      timeZone: tz,
    }).format(ctx.now);
    return { time, hour, minute, second, ampm, weekday, date, tz };
  },
  toDisplay(d) {
    return d;
  },
};
