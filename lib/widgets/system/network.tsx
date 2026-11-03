import { useEffect, useState } from "react";
import { Sparkline, WidgetHeader, WidgetMessage } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#30d158";
const OFFLINE = "#ff453a";
const SAMPLE_MS = 5000;
const HISTORY = 24;

type EffectiveType = "slow-2g" | "2g" | "3g" | "4g";

type Connection = EventTarget & {
  effectiveType: EffectiveType;
  downlink: number;
  rtt: number;
  saveData: boolean;
};

type Reading = {
  online: boolean;
  type: EffectiveType;
  downlink: number;
  rtt: number;
  saveData: boolean;
  rttHistory: number[];
};

const QUALITY: Record<EffectiveType, { label: string; bars: number; color: string }> = {
  "slow-2g": { label: "Very slow", bars: 1, color: "#ff453a" },
  "2g": { label: "Slow", bars: 2, color: "#ff9f0a" },
  "3g": { label: "Moderate", bars: 3, color: "#ffd60a" },
  "4g": { label: "Fast", bars: 4, color: ACCENT },
};

const connection = () =>
  (navigator as Navigator & { connection?: Connection }).connection ?? null;

function useNetwork(): Reading | null {
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    const conn = connection();
    if (!conn) return;
    let history: number[] = [];

    const publish = (sample: boolean) => {
      if (sample) history = [...history, conn.rtt].slice(-HISTORY);
      setReading({
        online: navigator.onLine,
        type: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
        rttHistory: history,
      });
    };
    const onChange = () => publish(false);
    const onTick = () => !document.hidden && publish(true);

    onTick();
    const id = setInterval(onTick, SAMPLE_MS);
    conn.addEventListener("change", onChange);
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      clearInterval(id);
      conn.removeEventListener("change", onChange);
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  }, []);

  return reading;
}

function SignalBars({ bars, color, size }: { bars: number; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={1 + i * 6}
          y={18 - i * 5}
          width={4}
          height={5 + i * 5}
          rx={1.5}
          fill={i < bars ? color : "var(--label-quaternary)"}
        />
      ))}
    </svg>
  );
}

const downlinkLabel = (mbps: number) => (mbps >= 10 ? "10+ Mbps" : `${mbps} Mbps`);

function NetworkView({ size }: WidgetViewProps) {
  const reading = useNetwork();
  const header = (
    <WidgetHeader icon="wifi" label="Network" accent={reading?.online === false ? OFFLINE : ACCENT} />
  );

  if (!connection()) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>This browser does not report connection quality. Chrome and Edge do.</WidgetMessage>
      </div>
    );
  }

  if (!reading) return <div className="flex h-full w-full flex-col">{header}</div>;

  const quality = QUALITY[reading.type];
  const status = reading.online ? quality.label : "Offline";
  const color = reading.online ? quality.color : OFFLINE;
  const detail = reading.online ? `${reading.rtt} ms · ${downlinkLabel(reading.downlink)}` : "No connection";

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        {header}
        <div className="flex items-center gap-2.5">
          <SignalBars bars={reading.online ? quality.bars : 0} color={color} size={30} />
          <span className="text-[20px] font-semibold leading-none">{status}</span>
        </div>
        <div className="tabular truncate text-[11px] font-medium text-secondary">{detail}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      <div className="flex items-center justify-between gap-2">
        {header}
        {reading.saveData && (
          <span className="text-[11px] font-medium text-tertiary">Data Saver on</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <SignalBars bars={reading.online ? quality.bars : 0} color={color} size={40} />
        <div className="min-w-0">
          <div className="text-[22px] font-semibold leading-tight">{status}</div>
          <div className="tabular text-[11px] font-medium text-secondary">{detail}</div>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-[10px] font-semibold text-tertiary">LATENCY</span>
        <Sparkline values={reading.rttHistory} color={color} width={150} height={22} />
      </div>
    </div>
  );
}

export const networkWidget: WidgetDefinition = {
  meta: {
    id: "system.network",
    name: "Network",
    tagline: "How good your connection is right now.",
    description:
      "Online status, connection quality, latency and bandwidth as estimated by the browser. Chrome rounds these values for privacy.",
    category: "information",
    icon: "wifi",
    accent: ACCENT,
    tags: ["system", "network", "internet"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  View: NetworkView,
};
