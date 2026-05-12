import { WidgetDefinition } from "../types";

type PetCfg = { name?: string };
type PetData = {
  name: string;
  mood: "happy" | "sleepy" | "hungry" | "playful";
  face: string;
  hunger: number;
  energy: number;
  joy: number;
};

const FACES: Record<PetData["mood"], string> = {
  happy: "(◕‿◕)",
  sleepy: "(-_-) zZ",
  hungry: "(•́﹏•̀)",
  playful: "(╯°□°)╯",
};

export const pixelPetWidget: WidgetDefinition<PetCfg, PetData> = {
  meta: {
    id: "system.pixelpet",
    slug: "pixelpet",
    name: "Pocket Pet",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Tiny digital companion",
    refreshIntervalSeconds: 60,
    category: "fun",
    tags: ["pet", "fun"],
    accent: "#f472b6",
    allowedSizes: ["small", "medium"],
    summary: "A tiny pixel companion that needs care",
  },
  defaultConfig: { name: "Bit" },
  configFields: [
    { kind: "text", key: "name", label: "Pet name", placeholder: "Bit" },
  ],
  async fetchData(cfg, ctx) {
    const h = ctx.now.getHours();
    const m = ctx.now.getMinutes();
    let mood: PetData["mood"] = "happy";
    if (h < 7 || h >= 22) mood = "sleepy";
    else if (h === 12 || h === 18) mood = "hungry";
    else if (m % 13 === 0) mood = "playful";
    const t = (h * 60 + m) / (24 * 60);
    return {
      name: cfg.name || "Bit",
      mood,
      face: FACES[mood],
      hunger: Math.round(40 + 50 * Math.abs(Math.sin(t * Math.PI * 2))),
      energy: Math.round(50 + 40 * Math.cos(t * Math.PI * 2)),
      joy: Math.round(60 + 30 * Math.sin(t * Math.PI * 4)),
    };
  },
  toDisplay(d) {
    return d;
  },
};
