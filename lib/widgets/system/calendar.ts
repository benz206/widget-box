import { WidgetDefinition } from "../types";

type CalCfg = Record<string, never>;
type CalData = { weekday: string; day: string; month: string; events: { time: string; title: string }[] };

const EVENTS = [
  { time: "10:30", title: "Standup" },
  { time: "13:00", title: "Lunch w/ Alex" },
  { time: "15:45", title: "Design review" },
];

export const calendarWidget: WidgetDefinition<CalCfg, CalData> = {
  meta: {
    id: "system.calendar",
    slug: "calendar",
    name: "Calendar",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Today's date and agenda",
    refreshIntervalSeconds: 3600,
    category: "productivity",
    tags: ["calendar", "events"],
    accent: "#f87171",
    summary: "Today's date and upcoming events",
  },
  defaultConfig: {},
  async fetchData(_cfg, ctx) {
    return {
      weekday: ctx.now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      day: String(ctx.now.getDate()),
      month: ctx.now.toLocaleDateString("en-US", { month: "long" }),
      events: EVENTS,
    };
  },
  toDisplay(d) {
    return d;
  },
};
