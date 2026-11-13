import { useEffect, useState } from "react";
import {
  ProgressRing,
  Sparkline,
  WidgetHeader,
  WidgetMessage,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const CPU = "#64d2ff";
const RAM = "#bf5af2";
const SAMPLE_MS = 2000;
const FIRST_SAMPLE_MS = 400;
const HISTORY = 30;

type PressureState = "nominal" | "fair" | "serious" | "critical";

type PressureObserverLike = {
  observe: (source: "cpu", options?: { sampleInterval?: number }) => Promise<void>;
  disconnect: () => void;
};

type PressureObserverCtor = new (
  callback: (records: { state: PressureState }[]) => void
) => PressureObserverLike;

const PRESSURE: Record<PressureState, { label: string; color: string }> = {
  nominal: { label: "Nominal", color: "#30d158" },
  fair: { label: "Fair", color: "#ffd60a" },
  serious: { label: "Serious", color: "#ff9f0a" },
  critical: { label: "Critical", color: "#ff453a" },
};

type CpuTime = { idle: number; total: number };

type Stats = {
  cpu: number;
  cores: number[];
  history: number[];
  ram: number;
  usedBytes: number;
  totalBytes: number;
};

function cpuLoad(prev: CpuTime[], next: CpuTime[]): { overall: number; cores: number[] } {
  let idle = 0;
  let total = 0;
  const cores = next.map((core, i) => {
    const dIdle = core.idle - (prev[i]?.idle ?? 0);
    const dTotal = core.total - (prev[i]?.total ?? 0);
    idle += dIdle;
    total += dTotal;
    return dTotal > 0 ? 1 - dIdle / dTotal : 0;
  });
  return { overall: total > 0 ? 1 - idle / total : 0, cores };
}

const hasSystemApi = () =>
  typeof chrome !== "undefined" && Boolean(chrome.system?.cpu && chrome.system?.memory);

function useSystemStats(): Stats | null {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!hasSystemApi()) return;
    let prev: CpuTime[] | null = null;
    let history: number[] = [];
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = async () => {
      if (!document.hidden) {
        const [cpu, memory] = await Promise.all([
          chrome.system.cpu.getInfo(),
          chrome.system.memory.getInfo(),
        ]);
        if (cancelled) return;
        const times = cpu.processors.map((p) => p.usage);
        if (prev) {
          const load = cpuLoad(prev, times);
          history = [...history, load.overall].slice(-HISTORY);
          setStats({
            cpu: load.overall,
            cores: load.cores,
            history,
            ram: 1 - memory.availableCapacity / memory.capacity,
            usedBytes: memory.capacity - memory.availableCapacity,
            totalBytes: memory.capacity,
          });
        }
        prev = times;
      }
      timer = setTimeout(tick, history.length ? SAMPLE_MS : FIRST_SAMPLE_MS);
    };

    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return stats;
}

function usePressure(): PressureState | null {
  const [state, setState] = useState<PressureState | null>(null);

  useEffect(() => {
    const Observer = (globalThis as { PressureObserver?: PressureObserverCtor }).PressureObserver;
    if (!Observer) return;
    const observer = new Observer((records) => setState(records[records.length - 1].state));
    observer.observe("cpu", { sampleInterval: SAMPLE_MS }).catch(() => setState(null));
    return () => observer.disconnect();
  }, []);

  return state;
}

const percent = (fraction: number) => Math.round(fraction * 100);
const gigabytes = (bytes: number) => (bytes / 2 ** 30).toFixed(1);

function Readout({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold" style={{ color }}>
        {label}
      </div>
      <div className="tabular text-[15px] font-medium leading-tight">{value}</div>
    </div>
  );
}

function MonitorView({ size }: WidgetViewProps) {
  const stats = useSystemStats();
  const pressure = usePressure();
  const header = <WidgetHeader icon="cpu" label="System" accent={CPU} />;

  if (!hasSystemApi()) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>Load Widget Box as a Chrome extension to read system stats.</WidgetMessage>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>Reading system…</WidgetMessage>
      </div>
    );
  }

  const dial = size === "small" ? 64 : 80;
  const rings = (
    <svg width={dial} height={dial} viewBox="-50 -50 100 100" className="shrink-0">
      <ProgressRing progress={stats.cpu} color={CPU} radius={42} stroke={11} />
      <ProgressRing progress={stats.ram} color={RAM} radius={27} stroke={11} />
    </svg>
  );

  const pressureLabel = pressure && (
    <span className="flex items-center gap-1 text-[11px] font-medium text-secondary">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: PRESSURE[pressure].color }} />
      {PRESSURE[pressure].label} load
    </span>
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        {header}
        <div className="flex items-center gap-3">
          {rings}
          <div className="flex flex-col gap-1">
            <Readout label="CPU" color={CPU} value={`${percent(stats.cpu)}%`} />
            <Readout label="RAM" color={RAM} value={`${percent(stats.ram)}%`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      <div className="flex items-center justify-between gap-2">
        {header}
        {pressureLabel}
      </div>
      <div className="flex items-center gap-4">
        {rings}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-end justify-between gap-2">
            <Readout label="CPU" color={CPU} value={`${percent(stats.cpu)}%`} />
            <Sparkline values={stats.history} color={CPU} width={96} height={26} />
          </div>
          <Readout
            label="MEMORY"
            color={RAM}
            value={`${gigabytes(stats.usedBytes)} / ${gigabytes(stats.totalBytes)} GB`}
          />
        </div>
      </div>
      {size === "large" && (
        <div className="flex flex-1 flex-col justify-end gap-1.5 border-t border-separator pt-2.5">
          <div className="text-[10px] font-semibold text-tertiary">
            {stats.cores.length} CORES
          </div>
          <div className="flex h-16 items-end gap-1">
            {stats.cores.map((load, i) => (
              <div key={i} className="flex h-full flex-1 items-end rounded-[3px] bg-fill">
                <div
                  className="w-full rounded-[3px]"
                  style={{
                    height: `${Math.max(4, percent(load))}%`,
                    background: CPU,
                    transition: "height 500ms var(--ease-out-ios)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const monitorWidget: WidgetDefinition = {
  meta: {
    id: "system.monitor",
    name: "System",
    tagline: "Live CPU and memory use.",
    description:
      "CPU and memory use sampled every two seconds, with the browser's compute pressure state and a per-core breakdown.",
    category: "information",
    icon: "cpu",
    accent: CPU,
    tags: ["system", "cpu", "memory"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  View: MonitorView,
};
