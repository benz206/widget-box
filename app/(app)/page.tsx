"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragMoveEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import WidgetTile from "@/app/components/WidgetTile";
import TilePreview from "@/app/components/widgets/TilePreview";
import Button, { ButtonLink } from "@/app/components/ui/Button";
import Icon from "@/app/components/ui/Icon";
import PageHeader from "@/app/components/ui/PageHeader";
import {
  createInstance,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  findFirstFit,
  rectsOverlap,
  useDashboard,
  type WidgetInstance,
} from "@/lib/storage/dashboard";
import { getWidgetById, listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import { SIZE_LABELS, WIDGET_SIZES, type WidgetPosition, type WidgetSize } from "@/lib/widgets/types";

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

function DashboardGreeting({
  name,
  timezone,
  actions,
}: {
  name?: string;
  timezone?: string;
  actions: React.ReactNode;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const hour = now ? Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(now)) : 12;
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <PageHeader
      eyebrow={now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: timezone }) ?? "\u00a0"}
      title={`${greeting}${name ? `, ${name}` : ""}`}
      actions={actions}
    />
  );
}

function DashboardSummary({
  instances,
  cols,
  rows,
}: {
  instances: WidgetInstance[];
  cols: number;
  rows: number;
}) {
  const total = cols * rows;
  const used = instances.reduce((sum, i) => sum + i.position.w * i.position.h, 0);
  const share = Math.round((used / total) * 100);
  const categories = new Set(instances.map((i) => getWidgetById(i.widgetId)?.meta.category)).size;
  const positions = instances.map((i) => i.position);
  const roomFor = (["large", "medium", "small"] as const).find((size) =>
    findFirstFit(positions, WIDGET_SIZES[size].w, WIDGET_SIZES[size].h, cols, rows)
  );

  return (
    <dl className="stat-strip">
      <div className="stat">
        <dt>Widgets</dt>
        <dd>{instances.length}</dd>
        <p>
          Across {categories} {categories === 1 ? "category" : "categories"}
        </p>
      </div>
      <div className="stat">
        <dt>Grid space used</dt>
        <dd>{share}%</dd>
        <div className="meter" aria-hidden>
          <span style={{ width: `${share}%` }} />
        </div>
        <p>
          {used} of {total} cells
        </p>
      </div>
      <div className="stat">
        <dt>Largest open slot</dt>
        <dd>{roomFor ? SIZE_LABELS[roomFor] : "None"}</dd>
        <p>
          {roomFor
            ? `${WIDGET_SIZES[roomFor].w}×${WIDGET_SIZES[roomFor].h} cells free`
            : "Remove a widget to make room"}
        </p>
      </div>
    </dl>
  );
}

function Welcome() {
  return (
    <>
      <PageHeader
        eyebrow="Welcome"
        title="Set up your dashboard"
        description="Widget Box is a grid of small, live widgets: the time, the weather, markets, a focus timer, notes. It runs in this browser and needs no account."
      />
      <div className="welcome-grid">
        <section className="card" aria-labelledby="get-started">
          <div className="card-header">
            <h2 id="get-started">Get started</h2>
            <span>About a minute</span>
          </div>
          <ol className="checklist">
            <li>
              <span className="step-index">1</span>
              <div>
                <h3>Pick a starting set</h3>
                <p>Choose a preset or hand-pick widgets, then set your name, timezone, and city.</p>
              </div>
              <ButtonLink href="/setup" variant="primary" size="sm">
                Start setup
              </ButtonLink>
            </li>
            <li>
              <span className="step-index">2</span>
              <div>
                <h3>Browse the library</h3>
                <p>{listWidgets().length} widgets for productivity, information, finance, and more.</p>
              </div>
              <ButtonLink href="/marketplace" size="sm">
                Browse
              </ButtonLink>
            </li>
            <li>
              <span className="step-index">3</span>
              <div>
                <h3>Arrange it your way</h3>
                <p>Drag tiles around a six-column grid, in small, medium, and large.</p>
              </div>
            </li>
          </ol>
        </section>
        <aside className="welcome-preview" aria-label="Example widgets">
          <TilePreview widgetId="system.clock" size="small" cell={148} />
          <TilePreview widgetId="system.calendar" size="small" cell={148} />
          <div className="col-span-2">
            <TilePreview widgetId="system.affirmation" size="medium" cell={148} />
          </div>
        </aside>
      </div>
    </>
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
  if (!hydrated) {
    return (
      <main className="page" aria-busy>
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-2 h-8 w-72" />
        <div className="skeleton mt-8 h-[104px] w-full" />
      </main>
    );
  }

  const isFirstRun = state === null;
  const isEmpty = state !== null && instances.length === 0;

  // Edit mode shows the whole board so there is somewhere to drag to; otherwise
  // the grid ends where the widgets do.
  const usedRows = instances.reduce((max, i) => Math.max(max, i.position.y + i.position.h), 0);
  const visibleRows = editMode ? rows : Math.max(usedRows, 1);

  return (
    <main className="page">
      {isFirstRun && <Welcome />}

      {!isFirstRun && (
        <DashboardGreeting
          name={state?.preferences.displayName}
          timezone={state?.preferences.timezone}
          actions={
            instances.length > 0 && (
              <>
                <Button
                  variant={editMode ? "primary" : "secondary"}
                  onClick={() => setEditMode((v) => !v)}
                >
                  <Icon name={editMode ? "check" : "grid"} size={14} />
                  {editMode ? "Done" : "Edit layout"}
                </Button>
                {!editMode && (
                  <ButtonLink href="/marketplace" variant="primary">
                    <Icon name="plus" size={14} />
                    Add widget
                  </ButtonLink>
                )}
              </>
            )
          }
        />
      )}

      {isEmpty && (
        <div className="card empty-state">
          <span className="icon-tile">
            <Icon name="grid" size={16} />
          </span>
          <h2>No widgets yet</h2>
          <p>Add one from the library and it shows up here.</p>
          <ButtonLink href="/marketplace" variant="primary">
            Browse widgets
          </ButtonLink>
        </div>
      )}

      {instances.length > 0 && <DashboardSummary instances={instances} cols={cols} rows={rows} />}

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
                marginTop: 32,
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

      {editMode && (
        <div role="toolbar" aria-label="Layout editing" className="action-bar">
          <span className="action-bar-title">Editing layout</span>
          <span className="action-bar-hint">
            {canDrag ? "Drag tiles to move them. Use ⚙ to resize." : "Use ⚙ on a tile to resize or remove it."}
          </span>
          <ButtonLink href="/marketplace" variant="ghost" size="sm">
            <Icon name="plus" size={14} />
            Add widget
          </ButtonLink>
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
    </main>
  );
}
