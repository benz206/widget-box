import { WidgetDefinition } from "../types";

type PomoCfg = { workMin?: number; breakMin?: number };
type PomoData = {
  phase: "work" | "break";
  remainingSec: number;
  totalSec: number;
};

export const pomodoroWidget: WidgetDefinition<PomoCfg, PomoData> = {
  meta: {
    id: "system.pomodoro",
    slug: "pomodoro",
    name: "Pomodoro",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "25/5 focus timer",
    refreshIntervalSeconds: 1,
    category: "productivity",
    tags: ["focus", "timer"],
    accent: "#f97316",
    allowedSizes: ["small", "medium"],
    summary: "Focus timer with work and break phases",
  },
  defaultConfig: { workMin: 25, breakMin: 5 },
  configFields: [
    { kind: "number", key: "workMin", label: "Work minutes", placeholder: "25", min: 1, max: 120 },
    { kind: "number", key: "breakMin", label: "Break minutes", placeholder: "5", min: 1, max: 120 },
  ],
  async fetchData(cfg, ctx) {
    const work = (cfg.workMin ?? 25) * 60;
    const brk = (cfg.breakMin ?? 5) * 60;
    const cycle = work + brk;
    const secondOfDay = ctx.now.getHours() * 3600 + ctx.now.getMinutes() * 60 + ctx.now.getSeconds();
    const inCycle = secondOfDay % cycle;
    const phase: "work" | "break" = inCycle < work ? "work" : "break";
    const totalSec = phase === "work" ? work : brk;
    const remainingSec = phase === "work" ? work - inCycle : cycle - inCycle;
    return { phase, remainingSec, totalSec };
  },
  toDisplay(d) {
    return d;
  },
};
