import { WidgetDefinition } from "../types";

type MusicCfg = Record<string, never>;
type MusicData = {
  track: string;
  artist: string;
  album: string;
  progressSec: number;
  durationSec: number;
  isPlaying: boolean;
  gradient: [string, string];
};

const TRACKS: Omit<MusicData, "progressSec" | "isPlaying">[] = [
  { track: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", durationSec: 244, gradient: ["#7c3aed", "#ec4899"] },
  { track: "Redbone", artist: "Childish Gambino", album: "Awaken, My Love!", durationSec: 326, gradient: ["#f59e0b", "#dc2626"] },
  { track: "Weightless", artist: "Marconi Union", album: "Ambient Transmissions", durationSec: 481, gradient: ["#06b6d4", "#3b82f6"] },
  { track: "Nuvole Bianche", artist: "Ludovico Einaudi", album: "Una Mattina", durationSec: 354, gradient: ["#10b981", "#0ea5e9"] },
];

export const musicWidget: WidgetDefinition<MusicCfg, MusicData> = {
  meta: {
    id: "system.music",
    slug: "music",
    name: "Now Playing",
    provider: "system",
    creator: "widget-box",
    size: "large",
    description: "Current track",
    refreshIntervalSeconds: 5,
    category: "lifestyle",
    tags: ["music", "media"],
    accent: "#ec4899",
    allowedSizes: ["medium", "large"],
    summary: "What's playing right now",
  },
  defaultConfig: {},
  async fetchData(_cfg, ctx) {
    const idx = Math.floor((ctx.now.getMinutes() / 60) * TRACKS.length) % TRACKS.length;
    const t = TRACKS[idx];
    const progressSec = Math.floor((ctx.now.getSeconds() / 60) * t.durationSec);
    return { ...t, progressSec, isPlaying: true };
  },
  toDisplay(d) {
    return d;
  },
};
