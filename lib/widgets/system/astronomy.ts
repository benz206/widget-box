import { WidgetDefinition } from "../types";

type AstroCfg = Record<string, never>;
type AstroData = {
  phaseName: string;
  illumination: number;
  phaseFraction: number;
  sunrise: string;
  sunset: string;
};

const PHASES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

function moonPhase(date: Date): number {
  const synodic = 29.53058867;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - ref) / (1000 * 60 * 60 * 24);
  return ((days % synodic) + synodic) % synodic / synodic;
}

export const astronomyWidget: WidgetDefinition<AstroCfg, AstroData> = {
  meta: {
    id: "system.astronomy",
    slug: "astronomy",
    name: "Sky",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Moon phase and sun times",
    refreshIntervalSeconds: 3600,
    category: "information",
    tags: ["moon", "sky", "sunrise"],
    accent: "#818cf8",
    allowedSizes: ["small", "medium"],
    summary: "Moon phase plus sunrise and sunset",
  },
  defaultConfig: {},
  async fetchData(_cfg, ctx) {
    const f = moonPhase(ctx.now);
    const idx = Math.round(f * 8) % 8;
    const illumination = Math.round((1 - Math.cos(f * Math.PI * 2)) * 50);
    return {
      phaseName: PHASES[idx],
      illumination,
      phaseFraction: f,
      sunrise: "6:42 AM",
      sunset: "7:18 PM",
    };
  },
  toDisplay(d) {
    return d;
  },
};
