"use client";

import type { WeatherResponse } from "@/app/api/weather/route";
import {
  MoonGlyph,
  useNow,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import { moonIllumination, moonPhase, moonPhaseName } from "@/lib/moon";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#5e5ce6";
const REFRESH_MS = 60 * 60 * 1000;

/** "2026-08-05T06:11" → "6:11 AM" */
function clockLabel(stamp: string): string {
  const hour = Number(stamp.slice(11, 13));
  return `${hour % 12 || 12}:${stamp.slice(14, 16)} ${hour < 12 ? "AM" : "PM"}`;
}

function SkyView({ size, config }: WidgetViewProps) {
  const city = String(config.city || "").trim();
  const now = useNow(60_000);
  const { data, error, loading } = useRemote<WeatherResponse>(
    city ? `/api/weather?q=${encodeURIComponent(city)}` : null,
    REFRESH_MS
  );

  if (!now) return <WidgetSkeleton />;

  const phase = moonPhase(now);
  const illumination = moonIllumination(phase);

  const sun = !city ? (
    <span className="text-[11px] text-tertiary">Set a city for sun times</span>
  ) : loading && !data ? (
    <span className="text-[11px] text-tertiary">Loading sun times…</span>
  ) : data ? (
    <div className="tabular flex gap-3 text-[11px] font-medium text-secondary">
      <span>↑ {clockLabel(data.today.sunrise)}</span>
      <span>↓ {clockLabel(data.today.sunset)}</span>
    </div>
  ) : (
    <span className="text-[11px] text-tertiary">{error ?? "Sun times unavailable"}</span>
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="moon" label="Sky" accent={ACCENT} />
        <div className="flex items-center gap-2.5">
          <MoonGlyph phase={phase} size={40} />
          <div className="min-w-0">
            <div className="truncate text-[12px] font-semibold leading-tight">
              {moonPhaseName(phase)}
            </div>
            <div className="tabular text-[11px] text-secondary">{illumination}% lit</div>
          </div>
        </div>
        {sun}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <WidgetHeader
        icon="moon"
        label={data?.place.name ? `Sky · ${data.place.name}` : "Sky"}
        accent={ACCENT}
      />
      <div className="flex items-center gap-4">
        <MoonGlyph phase={phase} size={size === "large" ? 84 : 58} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold leading-tight">
            {moonPhaseName(phase)}
          </div>
          <div className="tabular text-[12px] text-secondary">
            {illumination}% illuminated
          </div>
          {size === "large" && data && (
            <div className="mt-2 flex flex-col gap-0.5 text-[12px] text-secondary">
              <span className="tabular">Sunrise {clockLabel(data.today.sunrise)}</span>
              <span className="tabular">Sunset {clockLabel(data.today.sunset)}</span>
            </div>
          )}
        </div>
      </div>
      {size !== "large" && sun}
      {size === "large" && !data && sun}
    </div>
  );
}

export const skyWidget: WidgetDefinition = {
  meta: {
    id: "system.astronomy",
    name: "Sky",
    tagline: "Tonight's moon and today's light.",
    description:
      "The moon's real phase and illumination, plus sunrise and sunset for your city.",
    category: "information",
    icon: "moon",
    accent: ACCENT,
    tags: ["moon", "sunrise", "sunset"],
    sizes: ["small", "medium", "large"],
    defaultSize: "small",
  },
  defaultConfig: { city: "San Francisco" },
  configFields: [
    { kind: "text", key: "city", label: "City", placeholder: "San Francisco" },
  ],
  View: SkyView,
};
