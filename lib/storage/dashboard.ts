"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { WIDGET_SIZES, type WidgetPosition, type WidgetSize } from "../widgets/types";
import { clearWidgetState } from "../widgets/state";

export const DEFAULT_COLS = 6;
export const DEFAULT_ROWS = 4;

export type WidgetInstance = {
  instanceId: string;
  widgetId: string;
  size: WidgetSize;
  position: WidgetPosition;
  config: Record<string, unknown>;
  addedAt: string;
};

export type DashboardPreferences = {
  displayName?: string;
  timezone?: string;
  hour12?: boolean;
  weatherCity?: string;
  units?: "c" | "f";
  gridCols?: number;
  gridRows?: number;
};

export type DashboardState = {
  version: 2;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
  preferences: DashboardPreferences;
  instances: WidgetInstance[];
};

export const STORAGE_KEY = "widget-box:dashboard:v1";

// ── Geometry ───────────────────────────────────────────────────────────────

export function rectsOverlap(a: WidgetPosition, b: WidgetPosition): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function findFirstFit(
  taken: WidgetPosition[],
  w: number,
  h: number,
  cols: number,
  rows: number
): WidgetPosition | null {
  for (let y = 0; y <= rows - h; y++) {
    for (let x = 0; x <= cols - w; x++) {
      const candidate = { x, y, w, h };
      if (!taken.some((r) => rectsOverlap(candidate, r))) return candidate;
    }
  }
  return null;
}

/** Reading order, so a repack preserves how the dashboard looked. */
function inReadingOrder(instances: WidgetInstance[]): WidgetInstance[] {
  return [...instances].sort(
    (a, b) => a.position.y - b.position.y || a.position.x - b.position.x
  );
}

export function repack(
  instances: WidgetInstance[],
  cols: number,
  rows: number
): WidgetInstance[] {
  const taken: WidgetPosition[] = [];
  const packed: WidgetInstance[] = [];
  for (const inst of inReadingOrder(instances)) {
    const span = WIDGET_SIZES[inst.size] ?? WIDGET_SIZES.small;
    const spot = findFirstFit(taken, span.w, span.h, cols, rows);
    if (!spot) continue; // No room left in the new grid — drop the overflow.
    taken.push(spot);
    packed.push({ ...inst, position: spot });
  }
  return packed;
}

// ── Persistence ────────────────────────────────────────────────────────────

/** v1 stored a different size model (medium was 2x2) on a 5x5 grid. */
function migrateFromV1(raw: Record<string, unknown>, known: Set<string>): DashboardState {
  const legacy = (Array.isArray(raw.instances) ? raw.instances : []) as WidgetInstance[];
  const instances = legacy
    .filter((i) => i?.widgetId && known.has(i.widgetId))
    .map((i) => {
      const size: WidgetSize = WIDGET_SIZES[i.size] ? i.size : "small";
      return { ...i, size, config: i.config ?? {}, position: i.position ?? { x: 0, y: 0, w: 1, h: 1 } };
    });

  const prefs = (raw.preferences ?? {}) as Record<string, unknown> & DashboardPreferences;
  return {
    version: 2,
    setupComplete: raw.setupComplete === true,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {
      displayName: prefs.displayName,
      timezone: prefs.timezone,
      hour12: prefs.hour12,
      // v1 called this defaultCity.
      weatherCity: prefs.weatherCity ?? (prefs as { defaultCity?: string }).defaultCity,
      units: prefs.units,
      gridCols: DEFAULT_COLS,
      gridRows: DEFAULT_ROWS,
    },
    instances: repack(instances, DEFAULT_COLS, DEFAULT_ROWS),
  };
}

function parse(raw: string, known: Set<string>): DashboardState | null {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.instances)) {
    return null;
  }
  if (parsed.version === 2) {
    const state = parsed as unknown as DashboardState;
    return {
      ...state,
      instances: state.instances.filter((i) => known.has(i.widgetId)),
    };
  }
  if (parsed.version === 1) return migrateFromV1(parsed, known);
  return null;
}

export function loadDashboard(known: Set<string>): DashboardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parse(raw, known) : null;
  } catch {
    return null;
  }
}

export function saveDashboard(state: DashboardState): void {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  // The native `storage` event does not fire in the tab that wrote it.
  window.dispatchEvent(new CustomEvent("widget-box:dashboard-changed"));
}

export function createEmptyDashboard(): DashboardState {
  const now = new Date().toISOString();
  return {
    version: 2,
    setupComplete: false,
    createdAt: now,
    updatedAt: now,
    preferences: { gridCols: DEFAULT_COLS, gridRows: DEFAULT_ROWS },
    instances: [],
  };
}

export function createInstance(
  widgetId: string,
  opts: { size: WidgetSize; position: WidgetPosition; config?: Record<string, unknown> }
): WidgetInstance {
  return {
    instanceId: crypto.randomUUID(),
    widgetId,
    size: opts.size,
    position: opts.position,
    config: opts.config ?? {},
    addedAt: new Date().toISOString(),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export type DashboardActions = {
  addInstance(instance: WidgetInstance): void;
  removeInstance(instanceId: string): void;
  updateInstance(
    instanceId: string,
    patch: Partial<Omit<WidgetInstance, "instanceId">>
  ): void;
  setPreferences(patch: Partial<DashboardPreferences>): void;
  replaceState(state: DashboardState): void;
  reset(): void;
};

/**
 * @param known ids of currently registered widgets; instances referencing
 * anything else are dropped on read so a removed widget cannot break a render.
 */
export function useDashboard(known: Set<string>): {
  state: DashboardState | null;
  hydrated: boolean;
  actions: DashboardActions;
} {
  const [state, setState] = useState<DashboardState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => setState(loadDashboard(known));
    read();
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) read();
    };
    window.addEventListener("widget-box:dashboard-changed", read);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("widget-box:dashboard-changed", read);
      window.removeEventListener("storage", onStorage);
    };
  }, [known]);

  // Every action re-reads before writing so concurrent tabs cannot clobber
  // each other with a stale snapshot.
  const mutate = useCallback(
    (fn: (current: DashboardState) => DashboardState) => {
      saveDashboard(fn(loadDashboard(known) ?? createEmptyDashboard()));
    },
    [known]
  );

  const actions = useMemo<DashboardActions>(
    () => ({
      addInstance(instance) {
        mutate((s) => ({ ...s, instances: [...s.instances, instance] }));
      },
      removeInstance(instanceId) {
        clearWidgetState(instanceId);
        mutate((s) => ({
          ...s,
          instances: s.instances.filter((i) => i.instanceId !== instanceId),
        }));
      },
      updateInstance(instanceId, patch) {
        mutate((s) => ({
          ...s,
          instances: s.instances.map((i) =>
            i.instanceId === instanceId ? { ...i, ...patch, instanceId } : i
          ),
        }));
      },
      setPreferences(patch) {
        mutate((s) => ({ ...s, preferences: { ...s.preferences, ...patch } }));
      },
      replaceState(next) {
        saveDashboard(next);
      },
      reset() {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent("widget-box:dashboard-changed"));
      },
    }),
    [mutate]
  );

  return { state, hydrated, actions };
}
