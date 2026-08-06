"use client";

import { useNow, WidgetHeader, WidgetMessage } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#bf5af2";
const DAY_MS = 86_400_000;

/** Whole days between two local dates, ignoring the time of day. */
function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function CountdownView({ size, config }: WidgetViewProps) {
  const now = useNow(30_000);
  const label = String(config.label || "Countdown");
  const raw = String(config.date || "");
  // A bare yyyy-mm-dd parses as UTC, which shifts the date west of Greenwich.
  const target = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : null;

  if (!target || Number.isNaN(target.getTime())) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="flag" label={label} accent={ACCENT} />
        <WidgetMessage>Pick a date in this widget's settings.</WidgetMessage>
      </div>
    );
  }

  const days = now ? daysBetween(now, target) : null;
  const passed = days !== null && days < 0;
  const dateText = target.toLocaleDateString("en-US", {
    weekday: size === "small" ? undefined : "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <WidgetHeader icon="flag" label={label} accent={ACCENT} />
      <div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="tabular font-light leading-none tracking-tight"
            style={{ fontSize: size === "small" ? "2.4rem" : "3.2rem" }}
          >
            {days === null ? "–" : Math.abs(days)}
          </span>
          <span className="text-[13px] font-medium text-secondary">
            {days !== null && Math.abs(days) === 1 ? "day" : "days"}
            {passed ? " ago" : ""}
          </span>
        </div>
        {days === 0 && (
          <div className="mt-1 text-[13px] font-semibold" style={{ color: ACCENT }}>
            Today
          </div>
        )}
      </div>
      <div className="truncate text-[11px] font-medium text-secondary">{dateText}</div>
    </div>
  );
}

export const countdownWidget: WidgetDefinition = {
  meta: {
    id: "system.countdown",
    name: "Countdown",
    tagline: "Days until the thing you are waiting for.",
    description: "Counts down to any date, and keeps counting after it passes.",
    category: "productivity",
    icon: "flag",
    accent: ACCENT,
    tags: ["countdown", "dates"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  defaultConfig: { label: "Countdown", date: "" },
  configFields: [
    { kind: "text", key: "label", label: "Label", placeholder: "Launch day" },
    { kind: "date", key: "date", label: "Date" },
  ],
  View: CountdownView,
};
