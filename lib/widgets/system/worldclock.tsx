import Icon from "@/app/components/ui/Icon";
import {
  useNow,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import { zoneLabel } from "./clock";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#64d2ff";
const DAY_MS = 86_400_000;

function isZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function zonesOf(config: Record<string, unknown>): string[] {
  const raw = config.zones;
  const list = Array.isArray(raw) ? raw.map(String) : String(raw ?? "").split(",");
  return list.map((z) => z.trim()).filter((z) => z && isZone(z));
}

function describe(zone: string, now: Date, hour12: boolean) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const hour = pick("hour");
  const minute = pick("minute");
  const zonedDay = Date.UTC(pick("year"), pick("month") - 1, pick("day"));
  const localDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diff =
    (zonedDay - localDay) / 60_000 + hour * 60 + minute - (now.getHours() * 60 + now.getMinutes());
  const days = Math.round((zonedDay - localDay) / DAY_MS);

  const abs = Math.abs(diff);
  const offset =
    diff === 0
      ? "Same time"
      : `${diff > 0 ? "+" : "−"}${Math.floor(abs / 60)}h${abs % 60 ? ` ${abs % 60}m` : ""}`;

  return {
    zone,
    city: zoneLabel(zone),
    time: hour12
      ? `${hour % 12 || 12}:${String(minute).padStart(2, "0")}`
      : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    suffix: hour12 ? (hour < 12 ? "AM" : "PM") : "",
    offset,
    detail: days === 0 ? offset : `${days > 0 ? "Tomorrow" : "Yesterday"}, ${offset}`,
    daytime: hour >= 6 && hour < 18,
  };
}

type Zoned = ReturnType<typeof describe>;

function Time({ z, className }: { z: Zoned; className: string }) {
  return (
    <span className={`tabular whitespace-nowrap ${className}`}>
      {z.time}
      {z.suffix && (
        <span className="ml-0.5 text-[0.5em] font-semibold text-secondary">{z.suffix}</span>
      )}
    </span>
  );
}

function WorldClockView({ size, config }: WidgetViewProps) {
  const now = useNow(1000);
  const zones = zonesOf(config);
  const hour12 = config.hour12 !== false;

  if (!zones.length) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="globe" label="World Clocks" accent={ACCENT} />
        <WidgetMessage>Add timezones in settings.</WidgetMessage>
      </div>
    );
  }

  if (!now) return <WidgetSkeleton />;

  const limit = size === "small" ? 2 : size === "medium" ? 3 : 6;
  const rows = zones.slice(0, limit).map((zone) => describe(zone, now, hour12));

  if (size === "medium") {
    return (
      <div className="flex h-full w-full flex-col gap-2">
        <WidgetHeader icon="globe" label="World Clocks" accent={ACCENT} />
        <div className="flex min-h-0 flex-1 items-center">
          {rows.map((z, i) => (
            <div
              key={z.zone}
              className={`min-w-0 flex-1 ${i > 0 ? "border-l border-separator pl-3" : ""}`}
            >
              <div className="truncate text-[12px] font-semibold">{z.city}</div>
              <Time z={z} className="text-[1.6rem] font-light leading-tight tracking-tight" />
              <div className="truncate text-[11px] text-tertiary">{z.detail}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <WidgetHeader icon="globe" label="World Clocks" accent={ACCENT} />
      <div className="flex min-h-0 flex-1 flex-col justify-around">
        {rows.map((z) => (
          <div key={z.zone} className="flex items-center gap-2">
            {size === "large" && (
              <span className="shrink-0 text-tertiary">
                <Icon name={z.daytime ? "sun" : "moon"} size={14} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold leading-tight">{z.city}</div>
              <div className="truncate text-[10px] text-tertiary">
                {size === "large" ? z.detail : z.offset}
              </div>
            </div>
            <Time
              z={z}
              className={size === "large" ? "text-[1.5rem] font-light" : "text-[15px] font-medium"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const worldClockWidget: WidgetDefinition = {
  meta: {
    id: "system.worldclock",
    name: "World Clocks",
    tagline: "What time it is for everyone else.",
    description:
      "Several timezones at once, each with its offset from yours and whether it is already tomorrow there.",
    category: "productivity",
    icon: "globe",
    accent: ACCENT,
    tags: ["time", "timezone", "travel"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: {
    hour12: true,
    zones: ["America/New_York", "Europe/London", "Asia/Tokyo"],
  },
  configFields: [
    {
      kind: "list",
      key: "zones",
      label: "Timezones",
      placeholder: "America/New_York, Europe/London",
      help: "IANA names, comma separated. Small shows two, medium three, large six",
    },
    { kind: "toggle", key: "hour12", label: "12-hour time", help: "Off shows a 24-hour clock" },
  ],
  View: WorldClockView,
};
