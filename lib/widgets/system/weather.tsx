"use client";

import type { WeatherResponse } from "@/app/api/weather/route";
import {
  toDisplayTemp,
  useRemote,
  WeatherGlyph,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#0a84ff";
const REFRESH_MS = 10 * 60 * 1000;

/** "2026-08-05T21:00" → "9PM" */
function hourLabel(stamp: string): string {
  const hour = Number(stamp.slice(11, 13));
  return `${hour % 12 || 12}${hour < 12 ? "AM" : "PM"}`;
}

function WeatherView({ size, config }: WidgetViewProps) {
  const city = String(config.city || "").trim();
  const units = config.units === "f" ? "f" : "c";
  const { data, error, loading } = useRemote<WeatherResponse>(
    city ? `/api/weather?q=${encodeURIComponent(city)}` : null,
    REFRESH_MS
  );

  const temp = (celsius: number) => toDisplayTemp(celsius, units);

  if (!city) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="weather" label="Weather" accent={ACCENT} />
        <WidgetMessage>Set a city in this widget's settings.</WidgetMessage>
      </div>
    );
  }

  if (!data) {
    if (loading) return <WidgetSkeleton />;
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="weather" label="Weather" accent={ACCENT} />
        <WidgetMessage>{error ?? "Weather unavailable."}</WidgetMessage>
      </div>
    );
  }

  const { place, current, today, hourly } = data;

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <span className="truncate text-[12px] font-semibold">{place.name}</span>
          <WeatherGlyph kind={current.kind} isDay={current.isDay} size={26} />
        </div>
        <div className="tabular text-[2.6rem] font-light leading-none tracking-tight">
          {temp(current.tempC)}°
        </div>
        <div>
          <div className="truncate text-[11px] font-medium text-secondary">
            {current.label}
          </div>
          <div className="tabular text-[11px] text-tertiary">
            H:{temp(today.highC)}° L:{temp(today.lowC)}°
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{place.name}</div>
          <div className="tabular text-[2.9rem] font-light leading-none tracking-tight">
            {temp(current.tempC)}°
          </div>
          <div className="truncate text-[12px] font-medium text-secondary">
            {current.label}
          </div>
          <div className="tabular text-[11px] text-tertiary">
            H:{temp(today.highC)}° L:{temp(today.lowC)}° · Feels {temp(current.feelsLikeC)}°
          </div>
        </div>
        <WeatherGlyph kind={current.kind} isDay={current.isDay} size={size === "large" ? 54 : 44} />
      </div>

      {size === "large" && (
        <div className="flex justify-between border-t border-separator pt-2.5">
          {hourly.slice(0, 6).map((hour, i) => (
            <div key={hour.time} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-tertiary">
                {i === 0 ? "Now" : hourLabel(hour.time)}
              </span>
              <WeatherGlyph kind={hour.kind} isDay={hour.isDay} size={22} />
              <span className="tabular text-[12px] font-medium">{temp(hour.tempC)}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const weatherWidget: WidgetDefinition = {
  meta: {
    id: "system.weather",
    name: "Weather",
    tagline: "Real conditions for any city on earth.",
    description:
      "Current temperature, today's range, and the hours ahead, from the Open-Meteo forecast service.",
    category: "information",
    icon: "weather",
    accent: ACCENT,
    tags: ["weather", "forecast"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: { city: "San Francisco", units: "c" },
  configFields: [
    { kind: "text", key: "city", label: "City", placeholder: "San Francisco" },
    {
      kind: "select",
      key: "units",
      label: "Units",
      options: [
        { value: "c", label: "Celsius" },
        { value: "f", label: "Fahrenheit" },
      ],
    },
  ],
  View: WeatherView,
};
