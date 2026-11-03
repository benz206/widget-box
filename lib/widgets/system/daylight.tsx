import { useId } from "react";
import { geocode } from "@/lib/api/weather";
import {
  useNow,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import { GOLDEN_HIGH, GOLDEN_LOW, sunElevation, sunTimes, type SunTimes } from "@/lib/sun";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#ff9f0a";
const GOLDEN = "#ffcc00";
const DAY_MS = 86_400_000;
const STEP_MS = 10 * 60_000;

type Place = { name: string; latitude: number; longitude: number; timezone: string };

function localDayStart(ms: number, timeZone: string): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone }).format(ms).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatTime(ms: number | null, timeZone: string): string {
  if (ms === null) return "—";
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(ms);
}

function formatSpan(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const h = Math.floor(minutes / 60);
  return h > 0 ? `${h}h ${minutes % 60}m` : `${minutes}m`;
}

function nextEvent(now: number, today: SunTimes, tomorrow: SunTimes) {
  const events = [today, tomorrow].flatMap((t) => [
    { label: "Sunrise", at: t.sunrise },
    { label: "Golden hour", at: t.goldenEvening },
    { label: "Sunset", at: t.sunset },
  ]);
  return events.find((e): e is { label: string; at: number } => e.at !== null && e.at > now) ?? null;
}

function SunCurve({ times, lat, lon, now }: { times: SunTimes; lat: number; lon: number; now: number }) {
  const clip = useId();
  const width = 300;
  const height = 70;
  const start = times.noon - DAY_MS / 2;
  const samples: number[] = [];
  for (let t = start; t <= start + DAY_MS; t += STEP_MS) samples.push(sunElevation(t, lat, lon));

  const min = Math.min(...samples, -10);
  const max = Math.max(...samples, 10);
  const pad = 6;
  const y = (e: number) => pad + ((max - e) / (max - min)) * (height - pad * 2);
  const x = (i: number) => (i / (samples.length - 1)) * width;
  const path = samples.map((e, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(e).toFixed(1)}`).join("");
  const horizon = y(0);

  const offset = (((now - start) % DAY_MS) + DAY_MS) % DAY_MS;
  const sunX = (offset / DAY_MS) * width;
  const elevation = sunElevation(now, lat, lon);
  const up = elevation > 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" aria-hidden>
      <clipPath id={`${clip}-up`}>
        <rect x={0} y={0} width={width} height={horizon} />
      </clipPath>
      <rect
        x={0}
        y={y(GOLDEN_HIGH)}
        width={width}
        height={y(GOLDEN_LOW) - y(GOLDEN_HIGH)}
        fill={GOLDEN}
        opacity={0.12}
      />
      <line x1={0} x2={width} y1={horizon} y2={horizon} stroke="var(--label-quaternary)" strokeWidth={1} />
      <path d={path} fill="none" stroke="var(--label-quaternary)" strokeWidth={2} strokeDasharray="3 4" />
      <path d={path} fill="none" stroke={ACCENT} strokeWidth={2.5} clipPath={`url(#${clip}-up)`} />
      <circle
        cx={sunX}
        cy={y(elevation)}
        r={6}
        fill={up ? GOLDEN : "var(--label-tertiary)"}
        stroke={up ? ACCENT : "none"}
        strokeWidth={1.5}
      />
    </svg>
  );
}

function DaylightView({ size, config }: WidgetViewProps) {
  const city = String(config.city || "").trim();
  const now = useNow(60_000);
  const { data: place, error, loading } = useRemote<Place | null>(
    city ? `daylight:${city}` : null,
    (signal) => geocode(city, signal)
  );
  const header = (
    <WidgetHeader icon="sunrise" label={place ? `Daylight · ${place.name}` : "Daylight"} accent={ACCENT} />
  );

  if (!city || (!loading && !place)) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>
          {!city ? "Set a city in settings." : error ?? `No place matched "${city}".`}
        </WidgetMessage>
      </div>
    );
  }

  if (!place || !now) return <WidgetSkeleton />;

  const { latitude: lat, longitude: lon, timezone } = place;
  const nowMs = now.getTime();
  const dayStart = localDayStart(nowMs, timezone);
  const today = sunTimes(dayStart, lat, lon);
  const tomorrow = sunTimes(dayStart + DAY_MS, lat, lon);
  const next = nextEvent(nowMs, today, tomorrow);
  const time = (ms: number | null) => formatTime(ms, timezone);
  const dayLength =
    today.sunrise !== null && today.sunset !== null
      ? `${formatSpan(today.sunset - today.sunrise)} of daylight`
      : sunElevation(today.noon, lat, lon) > 0
        ? "Sun stays up all day"
        : "Sun stays down all day";

  const curve = <SunCurve times={today} lat={lat} lon={lon} now={nowMs} />;

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="sunrise" label="Daylight" accent={ACCENT} />
        {curve}
        {next ? (
          <div>
            <div className="truncate text-[12px] font-semibold">
              {next.label} {time(next.at)}
            </div>
            <div className="tabular text-[11px] text-secondary">in {formatSpan(next.at - nowMs)}</div>
          </div>
        ) : (
          <div className="text-[11px] text-secondary">{dayLength}</div>
        )}
      </div>
    );
  }

  const summary = (
    <div className="tabular flex justify-between gap-3 text-[11px] font-medium text-secondary">
      <span>↑ {time(today.sunrise)}</span>
      <span className="truncate text-tertiary">{dayLength}</span>
      <span>↓ {time(today.sunset)}</span>
    </div>
  );

  if (size === "medium") {
    return (
      <div className="flex h-full w-full flex-col justify-between gap-1">
        {header}
        {curve}
        {summary}
      </div>
    );
  }

  const rows = [
    { label: "Blue hour", value: `${time(today.blueMorning)} – ${time(today.goldenMorning)}` },
    { label: "Golden hour", value: `${time(today.goldenMorning)} – ${time(today.goldenMorningEnd)}` },
    { label: "Solar noon", value: time(today.noon) },
    { label: "Golden hour", value: `${time(today.goldenEvening)} – ${time(today.goldenEveningEnd)}` },
    { label: "Blue hour", value: `${time(today.goldenEveningEnd)} – ${time(today.blueEveningEnd)}` },
  ];

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      {header}
      {curve}
      {summary}
      <div className="flex flex-col gap-1 border-t border-separator pt-2.5">
        {rows.map((row, i) => (
          <div key={i} className="tabular flex justify-between gap-3 text-[12px]">
            <span className="text-tertiary">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const daylightWidget: WidgetDefinition = {
  meta: {
    id: "system.daylight",
    name: "Daylight",
    tagline: "Where the sun is, and when the light is good.",
    description:
      "The sun's path across today's sky, with sunrise, sunset, golden hour and blue hour, calculated on your device for any city.",
    category: "information",
    icon: "sunrise",
    accent: ACCENT,
    tags: ["sun", "sunrise", "sunset", "photography"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: { city: "San Francisco" },
  configFields: [{ kind: "text", key: "city", label: "City", placeholder: "San Francisco" }],
  View: DaylightView,
};
