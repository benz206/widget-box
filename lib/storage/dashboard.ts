"use client";

import { useEffect, useState, useCallback } from "react";
import type { WidgetSize } from "../widgets/types";

export type WidgetInstance = {
  instanceId: string;
  widgetId: string;
  size: WidgetSize;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, unknown>;
  addedAt: string;
};

export type DashboardPreferences = {
  displayName?: string;
  timezone?: string;
  hour12?: boolean;
  defaultCity?: string;
  units?: "c" | "f";
  accentColor?: string;
  gridCols?: number;
  gridRows?: number;
};

export type DashboardState = {
  version: 1;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: DashboardPreferences;
  instances: WidgetInstance[];
};

export type DashboardActions = {
  addInstance(instance: WidgetInstance): void;
  removeInstance(instanceId: string): void;
  updateInstance(instanceId: string, patch: Partial<Omit<WidgetInstance, "instanceId">>): void;
  setPositions(positions: Record<string, { x: number; y: number; w: number; h: number }>): void;
  setPreferences(patch: Partial<DashboardPreferences>): void;
  markSetupComplete(): void;
  replaceState(state: DashboardState): void;
  reset(): void;
};

export const STORAGE_KEY = "widget-box:dashboard:v1";

function isValidState(v: unknown): v is DashboardState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    s.version === 1 &&
    typeof s.setupComplete === "boolean" &&
    typeof s.createdAt === "string" &&
    typeof s.updatedAt === "string" &&
    typeof s.preferences === "object" &&
    Array.isArray(s.instances)
  );
}

export function loadDashboard(): DashboardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDashboard(state: DashboardState): void {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("widget-box:dashboard-changed"));
}

// CustomEvent needed because the native `storage` event doesn't fire in the originating tab.
export function subscribeDashboard(cb: (state: DashboardState | null) => void): () => void {
  const onCustom = () => cb(loadDashboard());
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb(loadDashboard());
  };
  window.addEventListener("widget-box:dashboard-changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("widget-box:dashboard-changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function createEmptyDashboard(): DashboardState {
  const now = new Date().toISOString();
  return {
    version: 1,
    setupComplete: false,
    createdAt: now,
    updatedAt: now,
    preferences: {},
    instances: [],
  };
}

export function createInstance(
  widgetId: string,
  opts?: {
    size?: WidgetSize;
    position?: { x: number; y: number; w: number; h: number };
    config?: Record<string, unknown>;
  }
): WidgetInstance {
  return {
    instanceId: crypto.randomUUID(),
    widgetId,
    size: opts?.size ?? "medium",
    position: opts?.position ?? { x: 0, y: 0, w: 2, h: 2 },
    config: opts?.config ?? {},
    addedAt: new Date().toISOString(),
  };
}

export function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function findFirstFit(
  taken: { x: number; y: number; w: number; h: number }[],
  w: number,
  h: number,
  cols: number,
  rows: number
): { x: number; y: number } | null {
  for (let y = 0; y <= rows - h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const candidate = { x, y, w, h };
      if (!taken.some((r) => rectsOverlap(candidate, r))) return { x, y };
    }
  }
  return null;
}

export function useDashboard(): {
  state: DashboardState | null;
  hydrated: boolean;
  actions: DashboardActions;
} {
  const [state, setState] = useState<DashboardState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadDashboard());
    setHydrated(true);
    const unsub = subscribeDashboard(setState);
    return unsub;
  }, []);

  const getOrBootstrap = useCallback((): DashboardState => {
    return loadDashboard() ?? createEmptyDashboard();
  }, []);

  const actions: DashboardActions = {
    addInstance(instance) {
      const s = getOrBootstrap();
      saveDashboard({ ...s, instances: [...s.instances, instance] });
    },
    removeInstance(instanceId) {
      const s = getOrBootstrap();
      saveDashboard({ ...s, instances: s.instances.filter((i) => i.instanceId !== instanceId) });
    },
    updateInstance(instanceId, patch) {
      const s = getOrBootstrap();
      saveDashboard({
        ...s,
        instances: s.instances.map((i) =>
          i.instanceId === instanceId ? { ...i, ...patch, instanceId } : i
        ),
      });
    },
    setPositions(positions) {
      const s = getOrBootstrap();
      saveDashboard({
        ...s,
        instances: s.instances.map((i) =>
          positions[i.instanceId] ? { ...i, position: positions[i.instanceId] } : i
        ),
      });
    },
    setPreferences(patch) {
      const s = getOrBootstrap();
      saveDashboard({ ...s, preferences: { ...s.preferences, ...patch } });
    },
    markSetupComplete() {
      const s = getOrBootstrap();
      saveDashboard({ ...s, setupComplete: true });
    },
    replaceState(next) {
      saveDashboard(next);
    },
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("widget-box:dashboard-changed"));
    },
  };

  return { state, hydrated, actions };
}
