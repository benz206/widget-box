import { useEffect, useState } from "react";

const KEY = "widget-box:usage";
const CHANGED_EVENT = "widget-box:usage-changed";

export type Service = "unsplash" | "open-meteo" | "yahoo";
export type RateLimit = { limit: number; remaining: number; at: number };
export type Usage = { day: string; counts: Partial<Record<Service, number>>; unsplash?: RateLimit };

const today = () => new Date().toLocaleDateString("en-CA");

function read(): Usage {
  try {
    const usage = JSON.parse(localStorage.getItem(KEY) ?? "null") as Usage | null;
    if (usage) return usage.day === today() ? usage : { ...usage, day: today(), counts: {} };
  } catch {
    try {
      localStorage.removeItem(KEY);
    } catch {
      return { day: today(), counts: {} };
    }
  }
  return { day: today(), counts: {} };
}

function write(usage: Usage) {
  try {
    localStorage.setItem(KEY, JSON.stringify(usage));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function recordRequest(service: Service, res?: Response) {
  const usage = read();
  usage.counts[service] = (usage.counts[service] ?? 0) + 1;
  const limit = Number(res?.headers.get("x-ratelimit-limit"));
  const remaining = Number(res?.headers.get("x-ratelimit-remaining"));
  if (service === "unsplash" && limit && Number.isFinite(remaining)) {
    usage.unsplash = { limit, remaining, at: Date.now() };
  }
  write(usage);
}

export function useUsage(): Usage {
  const [usage, setUsage] = useState(read);
  useEffect(() => {
    const sync = () => setUsage(read());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return usage;
}
