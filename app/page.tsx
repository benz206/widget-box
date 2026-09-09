"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import AppHeader from "./components/AppHeader";
import WidgetTile from "./components/WidgetTile";
import TilePreview from "./components/widgets/TilePreview";
import Icon from "./components/ui/Icon";
import {
  createInstance,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  findFirstFit,
  rectsOverlap,
  useDashboard,
} from "@/lib/storage/dashboard";
import { getWidgetById } from "@/lib/widgets/registry";
import { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import { WIDGET_SIZES, type WidgetPosition, type WidgetSize } from "@/lib/widgets/types";

registerSystemWidgets();

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

function DashboardGreeting({ name, timezone }: { name?: string; timezone?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const hour = now ? Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(now)) : 12;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="dashboard-intro animate-sheet-in">
      <div>
        <p className="eyebrow">{now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: timezone }) ?? "YOUR EVERYDAY, BEAUTIFULLY"}</p>
        <h1>{greeting}{name ? `, ${name}` : ""}.</h1>
        <p>A little clarity. A space that’s yours.</p>
      </div>
      <span className="space-badge material"><span /> Your personal space</span>
    </div>
  );
}

export default function Dashboard() {
  const { state, hydrated, actions } = useDashboard(SYSTEM_WIDGET_IDS);
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
  const instances = state?.instances ?? [];

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
    (_event: DragEndEvent) => {
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
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-separator border-t-accent" />
      </div>
    );
  }

  const isFirstRun = state === null;
  const isEmpty = state !== null && instances.length === 0;

  // Edit mode shows the whole board so there is somewhere to drag to; otherwise
  // the grid ends where the widgets do.
  const usedRows = instances.reduce((max, i) => Math.max(max, i.position.y + i.position.h), 0);
  const visibleRows = editMode ? rows : Math.max(usedRows, 1);

  return (
    <div className="min-h-screen">
      <AppHeader>
        {instances.length > 0 && (
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="press focus-ring header-edit"
            style={
              editMode
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "var(--fill)", color: "var(--label)" }
            }
          >
            <Icon name={editMode ? "check" : "gear"} size={14} />
            {editMode ? "Done" : "Edit"}
          </button>
        )}
      </AppHeader>

      <main className="dashboard-main">
        {!isFirstRun && <DashboardGreeting name={state?.preferences.displayName} timezone={state?.preferences.timezone} />}
        {isFirstRun && (
          <div className="welcome-layout animate-sheet-in">
            <div className="welcome-copy">
              <span className="eyebrow">A LITTLE SPACE FOR YOU</span>
              <h1>Your day.<br />A little more<br /><span>beautiful.</span></h1>
              <p>The things that matter, in one quiet place. Create a personal collection of widgets and make every day feel a little more considered.</p>
              <div className="welcome-actions">
                <Link href="/setup" className="primary-button press focus-ring">Make it yours <Icon name="chevronRight" size={16} /></Link>
                <Link href="/marketplace" className="text-button focus-ring">Explore widgets <Icon name="chevronRight" size={14} /></Link>
              </div>
              <span className="welcome-footnote"><Icon name="lock" size={13} /> No account needed. Just your space.</span>
            </div>
            <div className="welcome-showcase" aria-label="A preview of your widget collection">
              <div className="showcase-top"><span className="eyebrow">THE EVERYDAY COLLECTION</span><Icon name="sparkles" size={19} /></div>
              <div className="showcase-widgets">
                <TilePreview widgetId="system.clock" size="small" cell={158} />
                <TilePreview widgetId="system.calendar" size="small" cell={158} />
                <div className="showcase-wide"><TilePreview widgetId="system.affirmation" size="medium" cell={158} /></div>
              </div>
              <div className="showcase-caption"><span>Small things. A better day.</span><span>YOURS TO ARRANGE</span></div>
            </div>
            <div className="welcome-details">
              <span><Icon name="grid" size={17} /> Thoughtfully sized. Freely arranged.</span>
              <span><Icon name="photo" size={17} /> A fresh perspective, all day.</span>
              <span><Icon name="circleHalf" size={17} /> Beautiful from day to night.</span>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-fill text-tertiary">
              <Icon name="grid" size={26} />
            </span>
            <h2 className="text-[20px] font-semibold tracking-tight">
              Nothing here yet
            </h2>
            <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-secondary">
              Add a widget and it will show up right here.
            </p>
            <Link
              href="/marketplace"
              className="press focus-ring mt-6 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Browse widgets
            </Link>
          </div>
        )}

        {instances.length > 0 && (
          <div className="collection-heading">
            <div><Icon name="grid" size={15} /><h2>{editMode ? "Arrange your space" : "Your collection"}</h2><span>{instances.length}</span></div>
            <Link href="/marketplace" className="focus-ring text-button"><Icon name="plus" size={15} /> Add widget</Link>
          </div>
        )}

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
                  "--grid-gap": "20px",
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

            {editMode && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <Link
                  href="/marketplace"
                  className="press focus-ring flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
                  style={{ background: "var(--accent)" }}
                >
                  <Icon name="plus" size={15} strokeWidth={2.4} />
                  Add widget
                </Link>
                <p className="text-[12px] text-tertiary">
                  {canDrag
                    ? "Drag to rearrange · − removes · ⚙ opens settings"
                    : "− removes · ⚙ opens settings"}
                </p>
              </div>
            )}
          </DndContext>
        )}
        {instances.length > 0 && !editMode && <p className="dashboard-footer">A place for everything. A moment for you.</p>}
      </main>

      {notice && (
        <div
          role="status"
          className="animate-sheet-in material hairline fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-medium"
          style={{ boxShadow: "var(--tile-shadow-lifted)" }}
        >
          {notice}
        </div>
      )}
    </div>
  );
}
