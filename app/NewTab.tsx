import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragMoveEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import Library from "@/app/components/Library";
import NowPlaying from "@/app/components/NowPlaying";
import Settings from "@/app/components/Settings";
import Setup from "@/app/components/Setup";
import WidgetTile from "@/app/components/WidgetTile";
import Button from "@/app/components/ui/Button";
import Icon, { type IconName } from "@/app/components/ui/Icon";
import { useNow } from "@/app/components/widgets/kit";
import {
  createInstance,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  findFirstFit,
  rectsOverlap,
  useDashboard,
  DISPLAY_DEFAULTS,
  type DashboardPreferences,
} from "@/lib/storage/dashboard";
import { getWidgetById } from "@/lib/widgets/registry";
import { SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import { WIDGET_SIZES, type WidgetPosition, type WidgetSize } from "@/lib/widgets/types";

/** Below this width the grid reflows and coordinates stop meaning anything. */
const DRAG_BREAKPOINT = 720;

const ARROW_STEPS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "To move this tile, press Space or Enter to pick it up. Use the arrow keys to move it one cell at a time, then press Space or Enter to drop it, or Escape to cancel.",
};

type Metrics = { cell: number; gap: number; cols: number };

/**
 * Square cells: the row height is driven from the measured column width, which
 * CSS alone cannot express for a percentage-width grid.
 *
 * Takes the node rather than a ref, because the grid mounts only after
 * hydration and a ref object's identity would never tell us it appeared.
 */
function useGridMetrics(el: HTMLDivElement | null): Metrics {
  const [metrics, setMetrics] = useState<Metrics>({ cell: 150, gap: 16, cols: DEFAULT_COLS });

  useLayoutEffect(() => {
    if (!el) return;

    const measure = () => {
      const styles = getComputedStyle(el);
      const gap = parseFloat(styles.columnGap) || 0;
      const cols = styles.gridTemplateColumns.split(" ").filter(Boolean).length || 1;
      const cell = (el.clientWidth - gap * (cols - 1)) / cols;
      if (cell <= 0) return;
      el.style.setProperty("--cell", `${cell}px`);
      setMetrics((prev) =>
        Math.abs(prev.cell - cell) < 0.5 && prev.cols === cols && prev.gap === gap
          ? prev
          : { cell, gap, cols }
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return metrics;
}

function useCanDrag(): boolean {
  const [canDrag, setCanDrag] = useState(true);
  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${DRAG_BREAKPOINT}px)`);
    const sync = () => setCanDrag(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return canDrag;
}

function Digit({ value }: { value: string }) {
  const [shown, setShown] = useState({ current: value, previous: null as string | null });
  if (shown.current !== value) setShown({ current: value, previous: shown.current });
  return (
    <span className="digit">
      {shown.previous !== null && (
        <span key={`out-${shown.previous}-${shown.current}`} aria-hidden className="digit-out">
          {shown.previous}
        </span>
      )}
      <span key={`in-${shown.current}`} className={shown.previous !== null ? "digit-in" : undefined}>
        {shown.current}
      </span>
    </span>
  );
}

function Ticker({ text }: { text: string }) {
  return [...text].map((char, i) => <Digit key={text.length - i} value={char} />);
}

function Hero({ preferences }: { preferences?: DashboardPreferences }) {
  const now = useNow(1000) ?? new Date();
  const display = { ...DISPLAY_DEFAULTS, ...preferences };
  const timeZone = preferences?.timezone;
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: display.hour12,
    timeZone,
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const name = preferences?.displayName;

  return (
    <header className="hero">
      {display.showDate && (
        <p className="hero-date">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone })}
        </p>
      )}
      <time className="hero-clock tabular" dateTime={now.toISOString()} aria-label={`${part("hour")}:${part("minute")}`}>
        <Ticker text={`${part("hour")}:${part("minute")}`} />
        {display.showSeconds && (
          <span className="hero-seconds">
            <Ticker text={part("second")} />
          </span>
        )}
      </time>
      {display.showGreeting && <h1 className="hero-greeting">{`${greeting}${name ? `, ${name}` : ""}`}</h1>}
    </header>
  );
}

function glassAlpha(base: number, value: number) {
  const pivot = DISPLAY_DEFAULTS.tileOpacity;
  return value <= pivot ? (base * value) / pivot : base + ((1 - base) * (value - pivot)) / (100 - pivot);
}

function useGlass(opacity: number, blur: number) {
  useLayoutEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--glass-light", glassAlpha(0.74, opacity).toFixed(3));
    root.setProperty("--glass-dark", glassAlpha(0.5, opacity).toFixed(3));
    root.setProperty("--glass-blur", `${blur}px`);
  }, [opacity, blur]);
}

function useRadii(tile: number, search: number) {
  useLayoutEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--tile-radius", `${tile}px`);
    root.setProperty("--search-radius", `${search}px`);
  }, [tile, search]);
}

function SearchBar() {
  const [query, setQuery] = useState("");
  return (
    <form
      role="search"
      className="search-bar material"
      onSubmit={(e) => {
        e.preventDefault();
        const text = query.trim();
        if (!text) return;
        if (globalThis.chrome?.search) void chrome.search.query({ text, disposition: "CURRENT_TAB" });
        else location.href = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
      }}
    >
      <Icon name="search" size={16} />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the web"
        aria-label="Search the web"
        autoComplete="off"
      />
    </form>
  );
}

function ToolButton({ label, icon, pressed, onClick }: { label: string; icon: IconName; pressed?: boolean; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={pressed} onClick={onClick} className="glass-btn material focus-ring">
      <Icon name={icon} size={16} />
    </button>
  );
}

type Overlay = "library" | "settings" | "setup" | null;

export default function NewTab() {
  const { state, actions } = useDashboard(SYSTEM_WIDGET_IDS);
  const [overlay, setOverlay] = useState<Overlay>(state === null ? "setup" : null);
  const display = { ...DISPLAY_DEFAULTS, ...state?.preferences };
  useGlass(display.tileOpacity, display.tileBlur);
  useRadii(display.tileRadius, display.searchRadius);
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<WidgetPosition | null>(null);
  const [previewBlocked, setPreviewBlocked] = useState(false);
  const drop = useRef<{ position: WidgetPosition; blocked: boolean } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const metrics = useGridMetrics(gridEl);
  const canDrag = useCanDrag();

  const cols = state?.preferences.gridCols ?? DEFAULT_COLS;
  const rows = state?.preferences.gridRows ?? DEFAULT_ROWS;
  const instances = useMemo(() => state?.instances ?? [], [state]);

  const coordinateGetter = useCallback<KeyboardCoordinateGetter>(
    (event, { context, currentCoordinates }) => {
      const arrow = ARROW_STEPS[event.code];
      const rect = context.collisionRect;
      if (!arrow || !rect || !gridEl) return;
      event.preventDefault();
      const step = metrics.cell + metrics.gap;
      const grid = gridEl.getBoundingClientRect();
      return {
        x: Math.max(grid.left, Math.min(currentCoordinates.x + arrow[0] * step, grid.right - rect.width)),
        y: Math.max(grid.top, Math.min(currentCoordinates.y + arrow[1] * step, grid.bottom - rect.height)),
      };
    },
    [gridEl, metrics]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter, scrollBehavior: "auto" })
  );

  const announcements = useMemo<Announcements>(() => {
    const find = (id: string | number) => instances.find((i) => i.instanceId === id);
    const nameOf = (id: string | number) => {
      const instance = find(id);
      return (instance && getWidgetById(instance.widgetId)?.meta.name) ?? "Widget";
    };
    const place = (p?: WidgetPosition) => (p ? `column ${p.x + 1}, row ${p.y + 1}` : "its spot");
    return {
      onDragStart: ({ active }) =>
        `Picked up ${nameOf(active.id)}. Use arrow keys to move, Space to drop, Escape to cancel.`,
      onDragMove: ({ active }) =>
        drop.current
          ? `${nameOf(active.id)} is over ${place(drop.current.position)}${drop.current.blocked ? ", which is taken" : ""}.`
          : undefined,
      onDragOver: () => undefined,
      onDragEnd: ({ active }) => {
        const from = find(active.id)?.position;
        const to = drop.current;
        return to && !to.blocked && !(from && to.position.x === from.x && to.position.y === from.y)
          ? `${nameOf(active.id)} moved to ${place(to.position)}.`
          : `${nameOf(active.id)} stayed at ${place(from)}.`;
      },
      onDragCancel: ({ active }) =>
        `Move cancelled. ${nameOf(active.id)} is back at ${place(find(active.id)?.position)}.`,
    };
  }, [instances]);

  const announce = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((current) => (current === message ? null : current)), 2600);
  }, []);

  // ── Drag ────────────────────────────────────────────────────────────────
  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      const instance = instances.find((i) => i.instanceId === id);
      if (instance) setPreview(instance.position);
      drop.current = instance ? { position: instance.position, blocked: false } : null;
    },
    [instances]
  );

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      const id = String(event.active.id);
      const instance = instances.find((i) => i.instanceId === id);
      if (!instance) return;

      const step = metrics.cell + metrics.gap;
      const { x, y, w, h } = instance.position;
      const candidate: WidgetPosition = {
        x: Math.max(0, Math.min(Math.round(x + event.delta.x / step), cols - w)),
        y: Math.max(0, Math.min(Math.round(y + event.delta.y / step), rows - h)),
        w,
        h,
      };

      const blocked = instances.some(
        (other) =>
          other.instanceId !== id && rectsOverlap(other.position, candidate)
      );
      drop.current = { position: candidate, blocked };
      setPreviewBlocked(blocked);
      setPreview(candidate);
    },
    [instances, metrics, cols, rows]
  );

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setPreview(null);
    setPreviewBlocked(false);
  }, []);

  const onDragEnd = useCallback(
    () => {
      if (activeId && preview && !previewBlocked) {
        actions.updateInstance(activeId, { position: preview });
      }
      onDragCancel();
    },
    [activeId, preview, previewBlocked, actions, onDragCancel]
  );

  // ── Instance actions ────────────────────────────────────────────────────
  const changeSize = useCallback(
    (instanceId: string, size: WidgetSize) => {
      const instance = instances.find((i) => i.instanceId === instanceId);
      if (!instance) return;
      const span = WIDGET_SIZES[size];
      const others = instances
        .filter((i) => i.instanceId !== instanceId)
        .map((i) => i.position);

      // Prefer growing in place; fall back to the first free slot.
      const inPlace: WidgetPosition = {
        x: Math.max(0, Math.min(instance.position.x, cols - span.w)),
        y: Math.max(0, Math.min(instance.position.y, rows - span.h)),
        ...span,
      };
      const spot = others.some((other) => rectsOverlap(other, inPlace))
        ? findFirstFit(others, span.w, span.h, cols, rows)
        : inPlace;

      if (!spot) {
        announce("No room on the grid for that size.");
        return;
      }
      actions.updateInstance(instanceId, { size, position: spot });
    },
    [instances, actions, cols, rows, announce]
  );

  const duplicate = useCallback(
    (instanceId: string) => {
      const instance = instances.find((i) => i.instanceId === instanceId);
      if (!instance) return;
      const span = WIDGET_SIZES[instance.size];
      const spot = findFirstFit(
        instances.map((i) => i.position),
        span.w,
        span.h,
        cols,
        rows
      );
      if (!spot) {
        announce("No room on the grid for another widget.");
        return;
      }
      actions.addInstance(
        createInstance(instance.widgetId, {
          size: instance.size,
          position: spot,
          config: { ...instance.config },
        })
      );
    },
    [instances, actions, cols, rows, announce]
  );

  // ── Render ──────────────────────────────────────────────────────────────
  // Edit mode shows the whole board so there is somewhere to drag to; otherwise
  // the grid ends where the widgets do.
  const usedRows = instances.reduce((max, i) => Math.max(max, i.position.y + i.position.h), 0);
  const visibleRows = editMode ? rows : Math.max(usedRows, 1);

  return (
    <main className="newtab" data-layout={display.layout}>
      <nav aria-label="Dashboard tools" className="newtab-tools">
        {instances.length > 0 && (
          <ToolButton
            label={editMode ? "Done editing" : "Edit layout"}
            icon={editMode ? "check" : "grid"}
            pressed={editMode}
            onClick={() => setEditMode((v) => !v)}
          />
        )}
        <ToolButton label="Add widget" icon="plus" onClick={() => setOverlay("library")} />
        <ToolButton label="Settings" icon="gear" onClick={() => setOverlay("settings")} />
      </nav>

      <div className="newtab-intro">
        <Hero preferences={state?.preferences} />
        {display.showSearch && <SearchBar />}

        {instances.length === 0 && (
          <button type="button" className="glass-pill material focus-ring" onClick={() => setOverlay("library")}>
            <Icon name="plus" size={14} />
            Add widgets
          </button>
        )}
      </div>

      <div className="newtab-board">
        {instances.length > 0 && (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
            accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
          >
            <div
              ref={setGridEl}
              className="widget-grid"
              style={
                {
                  "--cols": cols,
                  "--grid-gap": "16px",
                  gridTemplateRows: `repeat(${visibleRows}, var(--cell, 150px))`,
                } as React.CSSProperties
              }
            >
              {editMode &&
                metrics.cols === cols &&
                Array.from({ length: cols * rows }).map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="grid-item grid-cell-guide"
                    style={
                      {
                        "--gx": (i % cols) + 1,
                        "--gy": Math.floor(i / cols) + 1,
                        "--gw": 1,
                        "--gh": 1,
                      } as React.CSSProperties
                    }
                  />
                ))}

              {preview && editMode && (
                <div
                  aria-hidden
                  className={`grid-item drop-preview ${previewBlocked ? "drop-preview--invalid" : ""}`}
                  style={
                    {
                      "--gx": preview.x + 1,
                      "--gy": preview.y + 1,
                      "--gw": preview.w,
                      "--gh": preview.h,
                    } as React.CSSProperties
                  }
                />
              )}

              {instances.map((instance) =>
                getWidgetById(instance.widgetId) ? (
                  <WidgetTile
                    key={instance.instanceId}
                    instance={instance}
                    editMode={editMode}
                    draggable={editMode && canDrag}
                    onSizeChange={(size) => changeSize(instance.instanceId, size)}
                    onConfigChange={(config) =>
                      actions.updateInstance(instance.instanceId, { config })
                    }
                    onRemove={() => actions.removeInstance(instance.instanceId)}
                    onDuplicate={() => duplicate(instance.instanceId)}
                  />
                ) : null
              )}
            </div>
          </DndContext>
        )}
      </div>

      {editMode && (
        <div role="toolbar" aria-label="Layout editing" className="action-bar">
          <span className="action-bar-title">Editing layout</span>
          <span className="action-bar-hint">
            {canDrag ? "Drag tiles to move them. Use ⚙ to resize." : "Use ⚙ on a tile to resize or remove it."}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setOverlay("library")}>
            <Icon name="plus" size={14} />
            Add widget
          </Button>
          <Button size="sm" onClick={() => setEditMode(false)}>
            Done
          </Button>
        </div>
      )}

      <div role="status" className="toast" data-open={notice ? true : undefined} style={{ bottom: editMode ? 88 : 24 }}>
        {notice && <Icon name="alert" size={15} />}
        {notice}
      </div>

      {display.nowPlaying === "corner" && <NowPlaying />}

      {overlay === "library" && <Library onClose={() => setOverlay(null)} />}
      {overlay === "settings" && (
        <Settings
          preferences={state?.preferences}
          onChange={actions.setPreferences}
          onRunSetup={() => setOverlay("setup")}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "setup" && <Setup onClose={() => setOverlay(null)} />}
    </main>
  );
}
