import { useEffect, useState } from "react";
import { buttonClass } from "@/app/components/ui/Button";
import {
  formatClock,
  useNow,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import {
  connectSpotify,
  fetchNowPlaying,
  isConnected,
  onConnectionChange,
  SPOTIFY_CAN_CONNECT,
  SPOTIFY_ENABLED,
  type NowPlaying,
} from "@/lib/api/spotify";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#1db954";
const POLL_MS = 5_000;

export function useSpotifyConnected(): boolean {
  const [connected, setConnected] = useState(isConnected);
  useEffect(() => onConnectionChange(() => setConnected(isConnected())), []);
  return connected;
}

export function useNowPlaying() {
  const connected = useSpotifyConnected();
  const remote = useRemote<NowPlaying | null>(connected ? "spotify" : null, fetchNowPlaying, POLL_MS);
  return { connected, ...remote };
}

export function useProgress(track: NowPlaying): number {
  const now = useNow(1000) ?? new Date();
  const elapsed = track.playing ? now.getTime() - track.fetchedAt : 0;
  return Math.min(track.durationMs, track.progressMs + elapsed);
}

export type AlbumColor = { tint: string; accent: string };

const albumColors = new Map<string, AlbumColor>();

function sampleColor(url: string): Promise<AlbumColor | null> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  return img.decode().then(
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 16;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, 16, 16);
      const pixels = ctx.getImageData(0, 0, 16, 16).data;
      let r = 0, g = 0, b = 0, total = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2]);
        const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
        const weight = 1 + ((max - min) / 255) * 8;
        r += pixels[i] * weight;
        g += pixels[i + 1] * weight;
        b += pixels[i + 2] * weight;
        total += weight;
      }
      const [h, s] = toHueSaturation(r / total, g / total, b / total);
      const color = {
        tint: `hsl(${h} ${Math.min(s, 60)}% 24%)`,
        accent: `hsl(${h} ${Math.max(s, 45)}% 55%)`,
      };
      albumColors.set(url, color);
      return color;
    },
    () => null
  );
}

function toHueSaturation(r: number, g: number, b: number): [number, number] {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;
  if (delta < 0.04) return [0, 0];
  const l = (max + min) / 2;
  const s = delta / (1 - Math.abs(2 * l - 1));
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const h =
    max === rn ? ((gn - bn) / delta) % 6 : max === gn ? (bn - rn) / delta + 2 : (rn - gn) / delta + 4;
  return [Math.round((h * 60 + 360) % 360), Math.round(s * 100)];
}

export function useAlbumColor(url: string | null): AlbumColor | null {
  const [sampled, setSampled] = useState<{ url: string; color: AlbumColor | null } | null>(null);
  useEffect(() => {
    if (!url || albumColors.has(url)) return;
    let cancelled = false;
    sampleColor(url).then((color) => !cancelled && setSampled({ url, color }));
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (!url) return null;
  return albumColors.get(url) ?? (sampled?.url === url ? sampled.color : null);
}

function Connect() {
  const [error, setError] = useState<string | null>(null);
  if (!SPOTIFY_ENABLED) return <WidgetMessage>Add a Spotify client ID in Settings.</WidgetMessage>;
  if (!SPOTIFY_CAN_CONNECT) return <WidgetMessage>Open a new tab in the extension to connect.</WidgetMessage>;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setError(null);
          connectSpotify().catch((err: Error) => setError(err.message));
        }}
        className={buttonClass({ size: "sm" })}
      >
        Connect Spotify
      </button>
      {error && <p className="text-[11px] text-tertiary">{error}</p>}
    </div>
  );
}

function Art({ track, className }: { track: NowPlaying; className?: string }) {
  return track.art ? (
    <img
      src={track.art}
      alt=""
      draggable={false}
      className={`aspect-square rounded-md object-cover ${track.playing ? "" : "opacity-60"} ${className ?? ""}`}
    />
  ) : (
    <div className={`aspect-square rounded-md bg-fill ${className ?? ""}`} />
  );
}

function Progress({ track, color, times }: { track: NowPlaying; color: string; times?: boolean }) {
  const progress = useProgress(track);
  return (
    <div>
      <div className="h-1 overflow-hidden rounded-full bg-fill">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(progress / track.durationMs) * 100}%`,
            background: color,
            transition: "background-color 600ms ease",
          }}
        />
      </div>
      {times && (
        <div className="tabular mt-1 flex justify-between text-[10px] text-tertiary">
          <span>{formatClock(progress / 1000)}</span>
          <span>{formatClock(track.durationMs / 1000)}</span>
        </div>
      )}
    </div>
  );
}

function Titles({ track, large }: { track: NowPlaying; large?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`truncate font-semibold leading-tight ${large ? "text-[15px]" : "text-[13px]"}`}>
        {track.title}
      </div>
      <div className="truncate text-[11px] text-secondary">{track.artist}</div>
    </div>
  );
}

function SpotifyView({ size }: WidgetViewProps) {
  const { connected, data: track, error, loading } = useNowPlaying();
  const accent = useAlbumColor(track?.art ?? null)?.accent ?? ACCENT;

  if (!connected || !track) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="music" label="Spotify" accent={ACCENT} />
        {!connected ? (
          <Connect />
        ) : loading ? (
          <WidgetSkeleton />
        ) : (
          <WidgetMessage>{error ?? "Nothing playing."}</WidgetMessage>
        )}
      </div>
    );
  }

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between gap-2">
        <Art track={track} className="h-14" />
        <Titles track={track} />
        <Progress track={track} color={accent} />
      </div>
    );
  }

  if (size === "medium") {
    return (
      <div className="flex h-full w-full items-center gap-3">
        <Art track={track} className="h-full" />
        <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
          <WidgetHeader icon="music" label={track.playing ? "Now playing" : "Paused"} accent={accent} />
          <Titles track={track} large />
          <Progress track={track} color={accent} times />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="min-h-0 flex-1">
        <Art track={track} className="h-full" />
      </div>
      <Titles track={track} large />
      <Progress track={track} color={accent} times />
    </div>
  );
}

export const spotifyWidget: WidgetDefinition = {
  meta: {
    id: "system.spotify",
    name: "Spotify",
    tagline: "What you're listening to right now.",
    description:
      "Shows the track or episode playing on your Spotify account, with album art and progress. Connect once with your Spotify account.",
    category: "lifestyle",
    icon: "music",
    accent: ACCENT,
    tags: ["music", "spotify", "now playing"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  View: SpotifyView,
};
