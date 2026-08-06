"use client";

import { useMemo } from "react";
import {
  useNow,
  WidgetHeader,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#0a84ff";

function safeZone(zone: unknown): string {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (typeof zone !== "string" || !zone.trim()) return local;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return local;
  }
}

/** "America/New_York" → "New York" */
function zoneLabel(zone: string): string {
  return (zone.split("/").pop() ?? zone).replace(/_/g, " ");
}

function useZoned(now: Date | null, zone: string) {
  return useMemo(() => {
    if (!now) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const pick = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);
    return {
      hour: pick("hour"),
      minute: pick("minute"),
      second: pick("second"),
      weekday: new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        weekday: "long",
      }).format(now),
      date: new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        month: "long",
        day: "numeric",
      }).format(now),
    };
  }, [now, zone]);
}

function ClockFace({
  hour,
  minute,
  second,
  size,
}: {
  hour: number;
  minute: number;
  second: number;
  size: number;
}) {
  const minuteAngle = minute * 6 + second * 0.1;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const r = 50;
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" aria-hidden>
      <circle r={r + 6} fill="var(--fill)" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line
          key={i}
          x1="0"
          y1={-r + 3}
          x2="0"
          y2={-r + (i % 3 === 0 ? 12 : 8)}
          stroke="var(--label-quaternary)"
          strokeWidth={i % 3 === 0 ? 3.5 : 2}
          strokeLinecap="round"
          transform={`rotate(${i * 30})`}
        />
      ))}
      <line
        x1="0"
        y1="6"
        x2="0"
        y2={-r * 0.55}
        stroke="var(--label)"
        strokeWidth="6"
        strokeLinecap="round"
        transform={`rotate(${hourAngle})`}
      />
      <line
        x1="0"
        y1="8"
        x2="0"
        y2={-r * 0.8}
        stroke="var(--label)"
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle})`}
      />
      <line
        x1="0"
        y1="12"
        x2="0"
        y2={-r * 0.85}
        stroke={ACCENT}
        strokeWidth="2"
        strokeLinecap="round"
        transform={`rotate(${second * 6})`}
      />
      <circle r="3.5" fill={ACCENT} />
    </svg>
  );
}

function Digital({
  hour,
  minute,
  hour12,
  className,
}: {
  hour: number;
  minute: number;
  hour12: boolean;
  className: string;
}) {
  const display = hour12 ? hour % 12 || 12 : hour;
  const suffix = hour < 12 ? "AM" : "PM";
  return (
    <div className={`tabular ${className}`}>
      {hour12 ? display : String(display).padStart(2, "0")}:
      {String(minute).padStart(2, "0")}
      {hour12 && (
        <span className="ml-1 align-top text-[0.42em] font-semibold text-secondary">
          {suffix}
        </span>
      )}
    </div>
  );
}

function ClockView({ size, config }: WidgetViewProps) {
  const zone = safeZone(config.timezone);
  const hour12 = config.hour12 !== false;
  const now = useNow(1000);
  const t = useZoned(now, zone);

  if (!t) return <WidgetSkeleton />;

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="clock" label={zoneLabel(zone)} accent={ACCENT} />
        <Digital
          hour={t.hour}
          minute={t.minute}
          hour12={hour12}
          className="text-[2.6rem] font-light leading-none tracking-tight"
        />
        <div className="text-[11px] font-medium text-secondary">
          {t.weekday.slice(0, 3)} {t.date}
        </div>
      </div>
    );
  }

  if (size === "medium") {
    return (
      <div className="flex h-full w-full items-center gap-4">
        <ClockFace hour={t.hour} minute={t.minute} second={t.second} size={78} />
        <div className="min-w-0 flex-1">
          <Digital
            hour={t.hour}
            minute={t.minute}
            hour12={hour12}
            className="text-[2.3rem] font-light leading-none tracking-tight"
          />
          <div className="mt-1 truncate text-[12px] font-medium text-secondary">
            {t.weekday}, {t.date}
          </div>
          <div className="truncate text-[11px] text-tertiary">{zoneLabel(zone)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-between">
      <WidgetHeader icon="clock" label={zoneLabel(zone)} accent={ACCENT} />
      <ClockFace hour={t.hour} minute={t.minute} second={t.second} size={150} />
      <div className="w-full text-center">
        <Digital
          hour={t.hour}
          minute={t.minute}
          hour12={hour12}
          className="text-[2rem] font-light leading-none tracking-tight"
        />
        <div className="mt-1 text-[12px] font-medium text-secondary">
          {t.weekday}, {t.date}
        </div>
      </div>
    </div>
  );
}

export const clockWidget: WidgetDefinition = {
  meta: {
    id: "system.clock",
    name: "Clock",
    tagline: "The time where you are, or anywhere else.",
    description:
      "A live clock with an analog face, in your own timezone or any other.",
    category: "productivity",
    icon: "clock",
    accent: ACCENT,
    tags: ["time", "timezone"],
    sizes: ["small", "medium", "large"],
    defaultSize: "small",
  },
  defaultConfig: { hour12: true, timezone: "" },
  configFields: [
    { kind: "toggle", key: "hour12", label: "12-hour time", help: "Off shows a 24-hour clock" },
    {
      kind: "text",
      key: "timezone",
      label: "Timezone",
      placeholder: "Leave empty for local",
      help: "An IANA name such as Europe/Paris",
    },
  ],
  View: ClockView,
};
