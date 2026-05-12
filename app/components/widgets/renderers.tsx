"use client";
import React from "react";
import { WidgetSize } from "@/lib/widgets/types";
export type { ConfigField } from "@/lib/widgets/types";
export { getConfigFields, getAccent } from "@/lib/widgets/registry";

export type RenderProps = {
  data: any;
  size: WidgetSize;
};

type WidgetSpec = {
  Render: React.FC<RenderProps>;
};

const widgets: Record<string, WidgetSpec> = {};

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// ─── Clock ───────────────────────────────────────────────────────────────────
widgets["system.clock"] = {
  Render: ({ data, size }) => {
    if (!data) return null;
    const big = size !== "small";
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="text-white/60 text-xs uppercase tracking-widest mb-1">{data.weekday}, {data.date}</div>
        <div className={big ? "text-6xl md:text-7xl font-light tracking-tight text-white tabular-nums" : "text-3xl font-semibold text-white tabular-nums"}>
          {data.time}
          {data.ampm && <span className="ml-2 text-base align-top text-white/60">{data.ampm}</span>}
        </div>
        <div className="text-white/50 text-[10px] mt-1 uppercase tracking-wider">{data.tz}</div>
      </div>
    );
  },
};

// ─── Weather ─────────────────────────────────────────────────────────────────
const WeatherIcon: React.FC<{ icon: string; size?: number }> = ({ icon, size = 40 }) => {
  const common = { width: size, height: size, viewBox: "0 0 64 64", fill: "none" } as const;
  const stroke = "currentColor";
  switch (icon) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="12" fill="#fbbf24" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return <line key={i} x1={32 + Math.cos(a) * 18} y1={32 + Math.sin(a) * 18} x2={32 + Math.cos(a) * 26} y2={32 + Math.sin(a) * 26} stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />;
          })}
        </svg>
      );
    case "moon":
      return <svg {...common}><path d="M44 36c-10 0-18-8-18-18 0-3 .8-6 2.2-8.5C19.6 12 12 21.2 12 32c0 12.2 9.8 22 22 22 10.8 0 20-7.6 22.5-16.2C56 39.2 53 40 50 40c-2.1 0-4.1-.3-6-1z" fill="#cbd5e1" /></svg>;
    case "cloud":
      return <svg {...common}><ellipse cx="32" cy="40" rx="20" ry="10" fill="#94a3b8" /><ellipse cx="22" cy="34" rx="10" ry="8" fill="#cbd5e1" /><ellipse cx="40" cy="30" rx="12" ry="10" fill="#e2e8f0" /></svg>;
    case "rain":
      return <svg {...common}><ellipse cx="32" cy="26" rx="18" ry="10" fill="#94a3b8" /><line x1="22" y1="42" x2="20" y2="52" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" /><line x1="32" y1="42" x2="30" y2="54" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" /><line x1="42" y1="42" x2="40" y2="52" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" /></svg>;
    case "snow":
      return <svg {...common}><ellipse cx="32" cy="26" rx="18" ry="10" fill="#e2e8f0" /><circle cx="22" cy="46" r="2" fill="#fff" /><circle cx="32" cy="50" r="2" fill="#fff" /><circle cx="42" cy="46" r="2" fill="#fff" /></svg>;
    case "storm":
      return <svg {...common}><ellipse cx="32" cy="22" rx="18" ry="10" fill="#475569" /><polygon points="30,32 24,44 30,44 26,56 40,40 32,40 36,32" fill="#fbbf24" /></svg>;
    case "cloud-sun":
      return <svg {...common}><circle cx="44" cy="22" r="8" fill="#fbbf24" /><ellipse cx="28" cy="38" rx="18" ry="10" fill="#cbd5e1" /></svg>;
    default:
      return <svg {...common}><circle cx="32" cy="32" r="14" fill={stroke} /></svg>;
  }
};

widgets["system.weather"] = {
  Render: ({ data, size }) => {
    if (!data) return null;
    if (size === "small") {
      return (
        <div className="flex flex-col items-center justify-center text-center w-full">
          <WeatherIcon icon={data.icon} size={28} />
          <div className="text-3xl font-bold text-white mt-1">{Math.round(data.tempC)}°</div>
          <div className="text-[10px] text-white/60 truncate max-w-full">{data.city}</div>
        </div>
      );
    }
    return (
      <div className="flex flex-col w-full h-full justify-between">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-white/80 font-medium">{data.city}</div>
            <div className="text-5xl font-light text-white tabular-nums leading-none mt-1">
              {Math.round(data.tempC)}°
            </div>
            <div className="text-xs text-white/70 mt-1">{data.condition}</div>
            <div className="text-[10px] text-white/50 mt-0.5">H:{Math.round(data.high)}° L:{Math.round(data.low)}°</div>
          </div>
          <WeatherIcon icon={data.icon} size={48} />
        </div>
        {size === "large" && data.hourly && (
          <div className="flex justify-between items-end mt-2 text-white/80">
            {data.hourly.slice(0, 6).map((h: any, i: number) => (
              <div key={i} className="flex flex-col items-center text-[10px] gap-1">
                <div>{h.hour}</div>
                <WeatherIcon icon={h.icon} size={18} />
                <div className="tabular-nums">{Math.round(h.tempC)}°</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

// ─── Calendar ────────────────────────────────────────────────────────────────
widgets["system.calendar"] = {
  Render: ({ data, size }) => {
    if (!data) return null;
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="text-[10px] uppercase tracking-widest font-bold text-red-400">{data.weekday}</div>
        <div className="text-5xl font-light text-white tabular-nums leading-none">{data.day}</div>
        {size !== "small" && (
          <div className="mt-3 w-full space-y-1">
            {data.events.slice(0, 3).map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                <span className="w-1 h-1 rounded-full bg-red-400" />
                <span className="tabular-nums text-white/50 w-10">{e.time}</span>
                <span className="truncate">{e.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

// ─── Battery ─────────────────────────────────────────────────────────────────
widgets["system.battery"] = {
  Render: ({ data }) => {
    if (!data) return null;
    const pct = data.percent;
    const color = pct > 60 ? "#34d399" : pct > 25 ? "#facc15" : "#f87171";
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <svg width="48" height="20" viewBox="0 0 48 20">
          <rect x="0" y="0" width="42" height="20" rx="4" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2" />
          <rect x="44" y="6" width="3" height="8" rx="1" fill="#fff" fillOpacity="0.5" />
          <rect x="3" y="3" width={Math.max(0, (pct / 100) * 36)} height="14" rx="2" fill={color} />
        </svg>
        <div className="text-2xl font-semibold text-white tabular-nums mt-2">{pct}%</div>
        <div className="text-[10px] text-white/60 mt-0.5 flex items-center gap-1">
          {data.charging && <span>⚡</span>}
          {data.deviceName}
        </div>
      </div>
    );
  },
};

// ─── Stocks ──────────────────────────────────────────────────────────────────
const Spark: React.FC<{ values: number[]; color: string; w?: number; h?: number }> = ({ values, color, w = 80, h = 24 }) => {
  if (!values?.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

widgets["system.stocks"] = {
  Render: ({ data, size }) => {
    if (!data?.tickers) return null;
    const rows = size === "small" ? 1 : size === "medium" ? 3 : 5;
    return (
      <div className="w-full h-full flex flex-col gap-2">
        {data.tickers.slice(0, rows).map((t: any, i: number) => {
          const up = t.changePct >= 0;
          const color = up ? "#34d399" : "#f87171";
          return (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-white tracking-wide">{t.symbol}</div>
                <div className="text-[10px] text-white/50 tabular-nums">${fmt(t.price)}</div>
              </div>
              <Spark values={t.spark} color={color} w={56} h={20} />
              <div className="text-xs tabular-nums font-medium" style={{ color }}>
                {up ? "+" : ""}{t.changePct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    );
  },
};

// ─── Music ───────────────────────────────────────────────────────────────────
function timeStr(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

widgets["system.music"] = {
  Render: ({ data, size }) => {
    if (!data) return null;
    const pct = (data.progressSec / data.durationSec) * 100;
    const compact = size === "small";
    return (
      <div className="w-full h-full flex items-center gap-4">
        <div
          className="rounded-xl shadow-lg shrink-0"
          style={{
            width: compact ? 48 : 72,
            height: compact ? 48 : 72,
            background: `linear-gradient(135deg, ${data.gradient[0]}, ${data.gradient[1]})`,
            boxShadow: `0 8px 24px ${data.gradient[0]}40`,
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">{data.track}</div>
          <div className="text-white/60 text-xs truncate">{data.artist}</div>
          {!compact && <div className="text-white/40 text-[10px] truncate mt-0.5">{data.album}</div>}
          <div className="mt-2 h-1 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full rounded-full bg-white/80" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-white/50 mt-1 tabular-nums">
            <span>{timeStr(data.progressSec)}</span>
            <span>{timeStr(data.durationSec)}</span>
          </div>
        </div>
      </div>
    );
  },
};

// ─── Fitness ─────────────────────────────────────────────────────────────────
const Ring: React.FC<{ value: number; goal: number; color: string; r: number; stroke: number }> = ({ value, goal, color, r, stroke }) => {
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / goal);
  return (
    <>
      <circle cx="0" cy="0" r={r} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth={stroke} />
      <circle
        cx="0" cy="0" r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90)"
      />
    </>
  );
};

widgets["system.fitness"] = {
  Render: ({ data, size }) => {
    if (!data) return null;
    const big = size !== "small";
    return (
      <div className="flex items-center gap-3 w-full h-full justify-center">
        <svg width={big ? 100 : 64} height={big ? 100 : 64} viewBox="-40 -40 80 80">
          <Ring value={data.move.value} goal={data.move.goal} color="#fb7185" r={32} stroke={6} />
          <Ring value={data.exercise.value} goal={data.exercise.goal} color="#a3e635" r={22} stroke={6} />
          <Ring value={data.stand.value} goal={data.stand.goal} color="#22d3ee" r={12} stroke={6} />
        </svg>
        {big && (
          <div className="flex flex-col text-[11px]">
            <span className="text-rose-400">Move {data.move.value}/{data.move.goal}</span>
            <span className="text-lime-400">Exercise {data.exercise.value}/{data.exercise.goal}</span>
            <span className="text-cyan-400">Stand {data.stand.value}/{data.stand.goal}</span>
          </div>
        )}
      </div>
    );
  },
};

// ─── Pomodoro ────────────────────────────────────────────────────────────────
widgets["system.pomodoro"] = {
  Render: ({ data }) => {
    if (!data) return null;
    const pct = 1 - data.remainingSec / data.totalSec;
    const min = Math.floor(data.remainingSec / 60).toString().padStart(2, "0");
    const sec = Math.floor(data.remainingSec % 60).toString().padStart(2, "0");
    const color = data.phase === "work" ? "#f97316" : "#34d399";
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <svg width="64" height="64" viewBox="-36 -36 72 72">
          <circle r="28" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="4" />
          <circle r="28" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28 * pct} ${2 * Math.PI * 28}`}
            transform="rotate(-90)" />
        </svg>
        <div className="text-xl font-semibold text-white tabular-nums -mt-12">{min}:{sec}</div>
        <div className="text-[10px] uppercase tracking-widest mt-7" style={{ color }}>
          {data.phase === "work" ? "Focus" : "Break"}
        </div>
      </div>
    );
  },
};

// ─── Mood ────────────────────────────────────────────────────────────────────
widgets["system.mood"] = {
  Render: ({ data }) => {
    if (!data) return null;
    return (
      <div
        className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
        style={{ background: `radial-gradient(circle at 30% 30%, ${data.gradient[1]}, ${data.gradient[0]})` }}
      >
        <div className="text-3xl">{data.emoji}</div>
        <div className="text-sm font-semibold text-white mt-1 drop-shadow">{data.label}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/70 mt-0.5">Mood Ring</div>
      </div>
    );
  },
};

// ─── Affirmation ─────────────────────────────────────────────────────────────
widgets["system.affirmation"] = {
  Render: ({ data, size }) => {
    if (!data) return null;
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-center px-1">
        <div className="text-amber-300/80 text-[10px] uppercase tracking-widest mb-1">A note for you</div>
        <div className={size === "small" ? "text-xs text-white leading-snug" : "text-sm text-white leading-snug"}>
          "{data.text}"
        </div>
      </div>
    );
  },
};

// ─── Astronomy / Sky ─────────────────────────────────────────────────────────
const MoonGlyph: React.FC<{ fraction: number; size?: number }> = ({ fraction, size = 36 }) => {
  // fraction 0..1; 0/1=new, 0.5=full
  const r = size / 2 - 2;
  const offsetX = Math.cos(fraction * Math.PI * 2) * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <mask id={`mphm-${fraction.toFixed(3)}`}>
          <rect width={size} height={size} fill="black" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="white" />
          <circle cx={size / 2 + offsetX} cy={size / 2} r={r} fill={fraction < 0.5 ? "black" : "white"} />
          {fraction >= 0.5 && <circle cx={size / 2 - offsetX} cy={size / 2} r={r} fill="black" />}
        </mask>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="#1e293b" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="#e2e8f0" mask={`url(#mphm-${fraction.toFixed(3)})`} />
    </svg>
  );
};

widgets["system.astronomy"] = {
  Render: ({ data }) => {
    if (!data) return null;
    return (
      <div className="flex flex-col items-center justify-center w-full text-center">
        <MoonGlyph fraction={data.phaseFraction} size={40} />
        <div className="text-[11px] text-white/80 mt-1 font-medium">{data.phaseName}</div>
        <div className="text-[10px] text-white/50">{data.illumination}% lit</div>
        <div className="text-[10px] text-white/40 mt-1 tabular-nums">
          ↑{data.sunrise} ↓{data.sunset}
        </div>
      </div>
    );
  },
};

// ─── Pixel Pet ───────────────────────────────────────────────────────────────
widgets["system.pixelpet"] = {
  Render: ({ data }) => {
    if (!data) return null;
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <div className="font-mono text-lg text-white mb-1">{data.face}</div>
        <div className="text-xs text-white/80 font-medium">{data.name}</div>
        <div className="text-[10px] text-white/50 uppercase tracking-widest">{data.mood}</div>
        <div className="grid grid-cols-3 gap-1.5 mt-2 w-full text-[8px] uppercase">
          <Bar label="HP" value={data.hunger} color="#f87171" />
          <Bar label="EN" value={data.energy} color="#60a5fa" />
          <Bar label="JY" value={data.joy} color="#fbbf24" />
        </div>
      </div>
    );
  },
};

const Bar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-white/50">{label}</span>
    <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
      <div className="h-full" style={{ width: `${value}%`, background: color }} />
    </div>
  </div>
);

// ─── Public API ──────────────────────────────────────────────────────────────
export function getWidgetSpec(id: string): WidgetSpec | undefined {
  return widgets[id];
}

export function getRenderer(id: string): React.FC<RenderProps> {
  return (
    widgets[id]?.Render ??
    (({ data }) => (
      <div className="text-xs text-white/60 text-center">
        <div className="font-semibold mb-1">No renderer</div>
        <code className="text-white/40 break-all">{JSON.stringify(data)}</code>
      </div>
    ))
  );
}
