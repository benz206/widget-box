"use client";

import { useMemo } from "react";
import { useNow, WidgetHeader, WidgetSkeleton } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#ff453a";
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Every cell of the month grid, padded to whole weeks. */
function monthGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CalendarView({ size }: WidgetViewProps) {
  // Only the date matters, so re-render once a minute rather than once a second.
  const now = useNow(60_000);

  const model = useMemo(() => {
    if (!now) return null;
    const today = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today - now.getDay());
    return {
      today,
      year,
      month,
      weekday: now.toLocaleDateString("en-US", { weekday: "long" }),
      monthName: now.toLocaleDateString("en-US", { month: "long" }),
      week: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
      }),
      cells: monthGrid(year, month),
    };
  }, [now]);

  if (!model) return <WidgetSkeleton />;

  const DateBlock = () => (
    <div>
      <div className="text-[11px] font-semibold uppercase" style={{ color: ACCENT }}>
        {model.weekday.slice(0, 3)}
      </div>
      <div className="tabular text-[2.75rem] font-light leading-none tracking-tight">
        {model.today}
      </div>
    </div>
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="calendar" label={model.monthName} accent={ACCENT} />
        <DateBlock />
        <div className="text-[11px] font-medium text-secondary">
          {model.monthName} {model.year}
        </div>
      </div>
    );
  }

  if (size === "medium") {
    return (
      <div className="flex h-full w-full items-center gap-5">
        <DateBlock />
        <div className="flex flex-1 justify-between">
          {model.week.map((d) => {
            const isToday = d.getDate() === model.today && d.getMonth() === model.month;
            return (
              <div key={d.toISOString()} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-tertiary">
                  {WEEKDAYS[d.getDay()]}
                </span>
                <span
                  className="tabular flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium"
                  style={
                    isToday
                      ? { background: ACCENT, color: "#fff" }
                      : { color: "var(--label-secondary)" }
                  }
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold">
          {model.monthName}{" "}
          <span className="font-normal text-tertiary">{model.year}</span>
        </span>
        <span className="text-[11px] font-semibold uppercase" style={{ color: ACCENT }}>
          {model.weekday}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-tertiary">
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1 grid flex-1 grid-cols-7 place-items-center gap-y-0.5">
        {model.cells.map((day, i) => (
          <span
            key={i}
            className="tabular flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
            style={
              day === model.today
                ? { background: ACCENT, color: "#fff", fontWeight: 600 }
                : { color: day ? "var(--label-secondary)" : "transparent" }
            }
          >
            {day ?? "·"}
          </span>
        ))}
      </div>
    </div>
  );
}

export const calendarWidget: WidgetDefinition = {
  meta: {
    id: "system.calendar",
    name: "Calendar",
    tagline: "Today's date, this week, and the whole month.",
    description:
      "The date at a glance, growing into a week strip and a full month grid.",
    category: "productivity",
    icon: "calendar",
    accent: ACCENT,
    tags: ["date", "month"],
    sizes: ["small", "medium", "large"],
    defaultSize: "small",
  },
  View: CalendarView,
};
