"use client";

import { useEffect, useState } from "react";
import { WidgetHeader, WidgetMessage } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#30d158";

type BatteryManager = EventTarget & {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
};

type Reading = { percent: number; charging: boolean; secondsLeft: number };

const EVENTS = ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"];

/** Battery Status API — Chromium only; Safari and Firefox removed it. */
function useBattery(): { reading: Reading | null; supported: boolean | null } {
  const [reading, setReading] = useState<Reading | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const getBattery = (
      navigator as Navigator & { getBattery?: () => Promise<BatteryManager> }
    ).getBattery;

    if (typeof getBattery !== "function") {
      setSupported(false);
      return;
    }

    let battery: BatteryManager | null = null;
    let cancelled = false;

    const publish = () => {
      if (!battery) return;
      setReading({
        percent: Math.round(battery.level * 100),
        charging: battery.charging,
        secondsLeft: battery.charging ? battery.chargingTime : battery.dischargingTime,
      });
    };

    getBattery.call(navigator).then(
      (b) => {
        if (cancelled) return;
        battery = b;
        setSupported(true);
        publish();
        EVENTS.forEach((e) => b.addEventListener(e, publish));
      },
      () => !cancelled && setSupported(false)
    );

    return () => {
      cancelled = true;
      EVENTS.forEach((e) => battery?.removeEventListener(e, publish));
    };
  }, []);

  return { reading, supported };
}

function levelColor(percent: number, charging: boolean): string {
  if (charging) return ACCENT;
  if (percent <= 10) return "#ff453a";
  if (percent <= 20) return "#ff9f0a";
  return ACCENT;
}

function BatteryGlyph({ percent, color, width }: { percent: number; color: string; width: number }) {
  const height = width * 0.46;
  const inset = width * 0.055;
  const capacity = width * 0.82 - inset * 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <rect
        x="0.75"
        y="0.75"
        width={width * 0.82}
        height={height - 1.5}
        rx={height * 0.3}
        fill="none"
        stroke="var(--label-quaternary)"
        strokeWidth="1.5"
      />
      <path
        d={`M${width * 0.86} ${height * 0.33}v${height * 0.34}a${height * 0.17} ${height * 0.17} 0 0 0 0-${height * 0.34}Z`}
        fill="var(--label-quaternary)"
      />
      <rect
        x={inset + 0.75}
        y={inset + 0.75}
        width={Math.max(2, (percent / 100) * capacity)}
        height={height - inset * 2 - 1.5}
        rx={(height - inset * 2) * 0.28}
        fill={color}
        style={{ transition: "width 500ms var(--ease-out-ios)" }}
      />
    </svg>
  );
}

function formatRemaining(seconds: number, charging: boolean): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  const time = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return charging ? `${time} to full` : `${time} left`;
}

function BatteryView({ size }: WidgetViewProps) {
  const { reading, supported } = useBattery();

  if (supported === false) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="battery" label="Battery" accent={ACCENT} />
        <WidgetMessage>
          This browser does not report battery status. Chrome and Edge do.
        </WidgetMessage>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="battery" label="Battery" accent={ACCENT} />
        <WidgetMessage>Reading battery…</WidgetMessage>
      </div>
    );
  }

  const color = levelColor(reading.percent, reading.charging);
  const remaining = formatRemaining(reading.secondsLeft, reading.charging);

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <WidgetHeader icon="battery" label="Battery" accent={color} />
      <div className="flex items-center gap-3">
        <BatteryGlyph percent={reading.percent} color={color} width={size === "small" ? 52 : 66} />
        <div
          className="tabular font-light leading-none tracking-tight"
          style={{ fontSize: size === "small" ? "1.9rem" : "2.4rem" }}
        >
          {reading.percent}
          <span className="text-[0.5em] text-secondary">%</span>
        </div>
      </div>
      <div className="truncate text-[11px] font-medium text-secondary">
        {reading.charging ? "Charging" : "On battery"}
        {remaining ? ` · ${remaining}` : ""}
      </div>
    </div>
  );
}

export const batteryWidget: WidgetDefinition = {
  meta: {
    id: "system.battery",
    name: "Battery",
    tagline: "This device's actual charge.",
    description:
      "Live charge level and time remaining, read from the browser's Battery Status API.",
    category: "information",
    icon: "battery",
    accent: ACCENT,
    tags: ["system", "power"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  View: BatteryView,
};
