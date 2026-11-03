import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import Library from "@/app/components/Library";
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
  type DashboardPreferences,
} from "@/lib/storage/dashboard";
import { getWidgetById } from "@/lib/widgets/registry";
import { SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import { WIDGET_SIZES, type WidgetPosition, type WidgetSize } from "@/lib/widgets/types";

/** Below this width the grid reflows and coordinates stop meaning anything. */
const DRAG_BREAKPOINT = 720;

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

function Hero({ preferences }: { preferences?: DashboardPreferences }) {
  const now = useNow(1000) ?? new Date();
  const timeZone = preferences?.timezone;
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: preferences?.hour12 ?? true, timeZone })
    .formatToParts(now)
    .filter((part) => part.type === "hour" || part.type === "minute")
    .map((part) => part.value)
    .join(":");
  const name = preferences?.displayName;

  return (
    <header className="hero">
      <p className="hero-date">
        {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone })}
      </p>
      <time className="hero-clock tabular" dateTime={now.toISOString()}>
        {time}
      </time>
      <h1 className="hero-greeting">{`${greeting}${name ? `, ${name}` : ""}`}</h1>
    </header>
  );
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
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState<WidgetPosition | null>(null);
  const [previewBlocked, setPreviewBlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gridEl, setGridEl] = useState<HTMLDivElement | null>(null);
  const metrics = useGridMetrics(gridEl);
  const canDrag = useCanDrag();

  const cols = state?.preferences.gridCols ?? DEFAULT_COLS;
  const rows = state?.preferences.gridRows ?? DEFAULT_ROWS;
  const instances = useMemo(() => state?.instances ?? [], [state]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

      setPreviewBlocked(
        instances.some(
          (other) =>
            other.instanceId !== id && rectsOverlap(other.position, candidate)
        )
      );
      setPreview(candidate);
    },
    [instances, metrics, cols, rows]
  );

  const onDragEnd = useCallback(
    () => {
      if (activeId && preview && !previewBlocked) {
        actions.updateInstance(activeId, { position: preview });
      }
      setActiveId(null);
      setPreview(null);
      setPreviewBlocked(false);
    },
    [activeId, preview, previewBlocked, actions]
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
    <main className="newtab">
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

      <Hero preferences={state?.preferences} />
      <SearchBar />

      {instances.length === 0 && (
        <button type="button" className="glass-pill material focus-ring" onClick={() => setOverlay("library")}>
          <Icon name="plus" size={14} />
          Add widgets
        </button>
      )}

      <div className="newtab-board">
        {instances.length > 0 && (
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
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

      {notice && (
        <div role="status" className="toast" style={{ bottom: editMode ? 88 : 24 }}>
          <Icon name="alert" size={15} />
          {notice}
        </div>
      )}

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
