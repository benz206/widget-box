import { fetchAir, type AirResponse } from "@/lib/api/air";
import {
  ProgressRing,
  Sparkline,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#00c7be";
const REFRESH_MS = 30 * 60 * 1000;

const LEVELS = [
  { max: 50, label: "Good", color: "#30d158" },
  { max: 100, label: "Moderate", color: "#ffd60a" },
  { max: 150, label: "Unhealthy for some", color: "#ff9f0a" },
  { max: 200, label: "Unhealthy", color: "#ff453a" },
  { max: 300, label: "Very unhealthy", color: "#bf5af2" },
  { max: Infinity, label: "Hazardous", color: "#a2453a" },
];

const levelOf = (aqi: number) => LEVELS.find((l) => aqi <= l.max)!;

function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function Level({ aqi }: { aqi: number }) {
  const level = levelOf(aqi);
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: level.color }} />
      <span className="truncate text-[12px] font-semibold">{level.label}</span>
    </div>
  );
}

function AirView({ size, config }: WidgetViewProps) {
  const city = String(config.city || "").trim();
  const { data, error, loading } = useRemote<AirResponse>(
    city ? `air:${city}` : null,
    (signal) => fetchAir(city, signal),
    REFRESH_MS
  );

  if (!city) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="leaf" label="Air Quality" accent={ACCENT} />
        <WidgetMessage>Set a city in settings.</WidgetMessage>
      </div>
    );
  }

  if (!data) {
    if (loading) return <WidgetSkeleton />;
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="leaf" label="Air Quality" accent={ACCENT} />
        <WidgetMessage>{error ?? "Air quality unavailable."}</WidgetMessage>
      </div>
    );
  }

  const uv = data.uv === null ? null : `UV ${Math.round(data.uv)} · ${uvLabel(data.uv)}`;

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="leaf" label={data.place} accent={ACCENT} />
        <div className="flex items-baseline gap-1">
          <span className="tabular text-[2.6rem] font-light leading-none tracking-tight">
            {data.aqi}
          </span>
          <span className="text-[11px] font-semibold text-tertiary">AQI</span>
        </div>
        <div>
          <Level aqi={data.aqi} />
          {uv && <div className="tabular truncate text-[11px] text-tertiary">{uv}</div>}
        </div>
      </div>
    );
  }

  const level = levelOf(data.aqi);
  const details = [
    data.pm25 !== null && `PM2.5 ${data.pm25.toFixed(1)} µg/m³`,
    data.pm10 !== null && `PM10 ${data.pm10.toFixed(1)} µg/m³`,
    uv,
  ].filter(Boolean);

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      <WidgetHeader icon="leaf" label={`Air Quality · ${data.place}`} accent={ACCENT} />
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 76, height: 76 }}>
          <svg width="100%" height="100%" viewBox="-50 -50 100 100">
            <ProgressRing progress={Math.min(data.aqi, 300) / 300} color={level.color} radius={43} stroke={8} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-[22px] font-light leading-none">{data.aqi}</span>
            <span className="text-[9px] font-semibold text-tertiary">AQI</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Level aqi={data.aqi} />
          {details.map((line) => (
            <div key={String(line)} className="tabular truncate text-[11px] text-secondary">
              {line}
            </div>
          ))}
        </div>
      </div>
      {size === "large" && data.hourly.length > 1 && (
        <div className="border-t border-separator pt-2.5">
          <div className="mb-1.5 flex justify-between text-[10px] font-semibold text-tertiary">
            <span>Next 12 hours</span>
            <span className="tabular">
              {Math.min(...data.hourly)}–{Math.max(...data.hourly)}
            </span>
          </div>
          <Sparkline values={data.hourly} color={level.color} width={240} height={36} />
        </div>
      )}
    </div>
  );
}

export const airWidget: WidgetDefinition = {
  meta: {
    id: "system.air",
    name: "Air Quality",
    tagline: "Whether it is a good day to be outside.",
    description:
      "The US air quality index, fine particulates, and UV for any city, from the Open-Meteo air quality service.",
    category: "information",
    icon: "leaf",
    accent: ACCENT,
    tags: ["air", "aqi", "pollution", "uv"],
    sizes: ["small", "medium", "large"],
    defaultSize: "small",
  },
  defaultConfig: { city: "San Francisco" },
  configFields: [
    { kind: "text", key: "city", label: "City", placeholder: "San Francisco" },
  ],
  View: AirView,
};
