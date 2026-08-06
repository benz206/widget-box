"use client";

import React, { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/app/components/ui/Icon";
import type { WeatherKind } from "@/lib/weather-codes";

// ── Hooks ──────────────────────────────────────────────────────────────────

/**
 * A ticking clock. Null until mounted, so the server and the first client
 * render agree — every caller renders a skeleton for that one frame.
 */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

type Remote<T> = { data: T | null; error: string | null; loading: boolean };

/** Fetches JSON, refreshes on an interval, and pauses while the tab is hidden. */
export function useRemote<T>(url: string | null, refreshMs?: number): Remote<T> {
  const [state, setState] = useState<Remote<T>>({
    data: null,
    error: null,
    loading: Boolean(url),
  });

  useEffect(() => {
    if (!url) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let controller: AbortController | null = null;
    let cancelled = false;

    const load = async () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(url, { signal: controller.signal });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
        setState({ data: body as T, error: null, loading: false });
      } catch (error) {
        if (cancelled || (error as Error).name === "AbortError") return;
        setState((prev) => ({
          data: prev.data,
          error: (error as Error).message,
          loading: false,
        }));
      }
    };

    setState((prev) => ({ ...prev, loading: !prev.data }));
    load();

    const id = refreshMs ? setInterval(load, refreshMs) : null;
    const onVisible = () => !document.hidden && load();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      controller?.abort();
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [url, refreshMs]);

  return state;
}

/** Latest value in a ref — for intervals that must not restart on every render. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// ── Layout ─────────────────────────────────────────────────────────────────

export function WidgetHeader({
  icon,
  label,
  accent,
  trailing,
}: {
  icon: IconName;
  label: string;
  accent?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span style={{ color: accent }} className="shrink-0">
        <Icon name={icon} size={13} strokeWidth={2} />
      </span>
      <span className="text-[11px] font-semibold text-secondary truncate">
        {label}
      </span>
      {trailing !== undefined && <span className="ml-auto shrink-0">{trailing}</span>}
    </div>
  );
}

export function WidgetMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center px-2 text-center">
      <p className="text-[11px] leading-snug text-tertiary">{children}</p>
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="flex h-full w-full flex-col justify-between">
      <div className="h-2.5 w-16 rounded-full bg-fill" />
      <div className="h-7 w-24 rounded-lg bg-fill" />
      <div className="h-2.5 w-20 rounded-full bg-fill" />
    </div>
  );
}

/** A compact, non-jarring control for in-widget actions. */
export function TapButton({
  onClick,
  label,
  icon,
  filled,
  accent,
}: {
  onClick: () => void;
  label: string;
  icon: IconName;
  filled?: boolean;
  accent?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="press focus-ring flex h-8 w-8 items-center justify-center rounded-full"
      style={
        filled
          ? { background: accent, color: "#fff" }
          : { background: "var(--fill)", color: "var(--label)" }
      }
    >
      <Icon name={icon} size={15} strokeWidth={2} />
    </button>
  );
}

// ── Marks ──────────────────────────────────────────────────────────────────

export function ProgressRing({
  progress,
  color,
  radius,
  stroke,
}: {
  progress: number;
  color: string;
  radius: number;
  stroke: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(1, Math.max(0, progress)) * circumference;
  return (
    <>
      <circle
        r={radius}
        fill="none"
        stroke={color}
        strokeOpacity={0.2}
        strokeWidth={stroke}
      />
      <circle
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90)"
        style={{ transition: "stroke-dasharray 500ms var(--ease-out-ios)" }}
      />
    </>
  );
}

export function Sparkline({
  values,
  color,
  width,
  height,
}: {
  values: number[];
  color: string;
  width: number;
  height: number;
}) {
  if (values.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 1.5;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SUN = "#ffcc00";
const CLOUD = "#c7c7cc";
const CLOUD_DARK = "#8e8e93";
const RAIN = "#0a84ff";
const SNOW = "#e5f2ff";
const BOLT = "#ffd60a";
const MOON = "#dfe3ea";

/** Weather marks, in the spirit of multicolour SF Symbols. */
export function WeatherGlyph({
  kind,
  isDay = true,
  size = 40,
}: {
  kind: WeatherKind;
  isDay?: boolean;
  size?: number;
}) {
  const props = { width: size, height: size, viewBox: "0 0 48 48", "aria-hidden": true } as const;
  const cloud = (
    <path
      d="M15 36a7.5 7.5 0 0 1-.8-15 10.5 10.5 0 0 1 20.1 2.4A6.6 6.6 0 0 1 33 36Z"
      fill={CLOUD}
    />
  );

  switch (kind) {
    case "clear":
      return isDay ? (
        <svg {...props}>
          <circle cx="24" cy="24" r="9" fill={SUN} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={24 + Math.cos(a) * 13}
                y1={24 + Math.sin(a) * 13}
                x2={24 + Math.cos(a) * 19}
                y2={24 + Math.sin(a) * 19}
                stroke={SUN}
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      ) : (
        <svg {...props}>
          <path
            d="M35 28.5A13 13 0 0 1 19.5 13a13.5 13.5 0 1 0 15.5 15.5Z"
            fill={MOON}
          />
        </svg>
      );
    case "partly":
      return (
        <svg {...props}>
          {isDay ? (
            <circle cx="32" cy="17" r="7.5" fill={SUN} />
          ) : (
            <path d="M38 21a9 9 0 0 1-10.7-10.7A9.4 9.4 0 1 0 38 21Z" fill={MOON} />
          )}
          <path
            d="M14 37a7 7 0 0 1-.7-14 10 10 0 0 1 19.1 2.3A6.2 6.2 0 0 1 31.5 37Z"
            fill={CLOUD}
          />
        </svg>
      );
    case "cloudy":
      return (
        <svg {...props}>
          <path
            d="M30 18a8.5 8.5 0 0 1 8 8 5.6 5.6 0 0 1-1 11H20a8 8 0 0 1-.8-16A9.5 9.5 0 0 1 30 18Z"
            fill={CLOUD_DARK}
            opacity="0.55"
          />
          {cloud}
        </svg>
      );
    case "fog":
      return (
        <svg {...props}>
          {cloud}
          <g stroke={CLOUD_DARK} strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="40" x2="36" y2="40" />
            <line x1="16" y1="45" x2="32" y2="45" />
          </g>
        </svg>
      );
    case "drizzle":
    case "rain":
      return (
        <svg {...props}>
          {cloud}
          <g stroke={RAIN} strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="39" x2="16" y2="45" />
            <line x1="25" y1="39" x2="23" y2="46" />
            <line x1="32" y1="39" x2="30" y2="45" />
          </g>
        </svg>
      );
    case "snow":
      return (
        <svg {...props}>
          {cloud}
          <g fill={SNOW}>
            <circle cx="17" cy="42" r="2.2" />
            <circle cx="24" cy="45" r="2.2" />
            <circle cx="31" cy="42" r="2.2" />
          </g>
        </svg>
      );
    case "storm":
      return (
        <svg {...props}>
          {cloud}
          <path d="M25 36 19 46h5l-2 7 9-11h-5l3-6Z" fill={BOLT} />
        </svg>
      );
  }
}

/** Moon disc lit from the correct limb for the given phase (0..1). */
export function MoonGlyph({
  phase,
  size = 40,
}: {
  phase: number;
  size?: number;
}) {
  const r = size / 2 - 1;
  const c = size / 2;
  const id = `moon-${phase.toFixed(4).replace(".", "")}`;
  // The terminator is an ellipse whose width collapses to zero at the
  // quarters and flips sense across them. Waxing lights the right limb.
  const k = Math.cos(phase * Math.PI * 2);
  const waxing = phase < 0.5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <mask id={id}>
          <rect width={size} height={size} fill="black" />
          <circle cx={c} cy={c} r={r} fill="white" />
          <rect x={waxing ? 0 : c} y={0} width={c} height={size} fill="black" />
          <ellipse
            cx={c}
            cy={c}
            rx={Math.abs(k) * r}
            ry={r}
            fill={k > 0 ? "black" : "white"}
          />
        </mask>
      </defs>
      <circle cx={c} cy={c} r={r} fill="var(--fill-secondary)" />
      <circle cx={c} cy={c} r={r} fill={MOON} mask={`url(#${id})`} />
    </svg>
  );
}

// ── Formatting ─────────────────────────────────────────────────────────────

export function toDisplayTemp(celsius: number, units: "c" | "f"): number {
  return Math.round(units === "f" ? celsius * 1.8 + 32 : celsius);
}

export function formatPrice(value: number): string {
  const digits = value >= 1000 ? 0 : value >= 1 ? 2 : 4;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
