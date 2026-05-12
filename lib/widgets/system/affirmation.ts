import { WidgetDefinition } from "../types";

type AffCfg = Record<string, never>;
type AffData = { text: string };

const LINES = [
  "Small steps still move the needle.",
  "Today is a draft, not a deadline.",
  "Progress over polish.",
  "Be where your feet are.",
  "You've handled 100% of your bad days so far.",
  "The hard thing is the right thing.",
  "Curiosity beats certainty.",
  "Less, but better.",
  "Done is the engine of more.",
  "Stay loose. Stay curious.",
];

export const affirmationWidget: WidgetDefinition<AffCfg, AffData> = {
  meta: {
    id: "system.affirmation",
    slug: "affirmation",
    name: "Daily Note",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Rotating affirmation",
    refreshIntervalSeconds: 1800,
    category: "ambient",
    tags: ["affirmation", "mindfulness"],
    accent: "#fbbf24",
    summary: "A gentle daily affirmation",
  },
  defaultConfig: {},
  async fetchData(_cfg, ctx) {
    const day = Math.floor(ctx.now.getTime() / (1000 * 60 * 30));
    return { text: LINES[day % LINES.length] };
  },
  toDisplay(d) {
    return d;
  },
};
