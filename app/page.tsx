"use client";
import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDashboard, createInstance, findFirstFit, rectsOverlap } from "@/lib/storage/dashboard";
import { getWidgetById } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";
import { WIDGET_SIZES, WidgetSize } from "@/lib/widgets/types";
import WidgetTile from "./components/WidgetTile";

registerSystemWidgets();

type Pos = { x: number; y: number; w: number; h: number };

export default function Home() {
  const { state, hydrated, actions } = useDashboard();
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropPreview, setDropPreview] = useState<Pos | null>(null);
  const [invalidDrop, setInvalidDrop] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const cols = state?.preferences.gridCols ?? 5;
  const rows = state?.preferences.gridRows ?? 5;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const cellSize = useCallback(() => {
    const el = gridRef.current;
    if (!el) return { cw: 0, ch: 0, gap: 0 };
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");
    const cw = (rect.width - gap * (cols - 1)) / cols;
    const ch = (rect.height - gap * (rows - 1)) / rows;
    return { cw, ch, gap };
  }, [cols, rows]);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!state) return;
      const id = String(event.active.id);
      setActiveId(id);
      const inst = state.instances.find((i) => i.instanceId === id);
      if (inst) setDropPreview({ ...inst.position });
    },
    [state]
  );

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!state) return;
      const id = String(event.active.id);
      const inst = state.instances.find((i) => i.instanceId === id);
      if (!inst) return;
      const start = inst.position;
      const { cw, ch, gap } = cellSize();
      if (!cw || !ch) return;

      const dx = event.delta.x;
      const dy = event.delta.y;
      const stepX = cw + gap;
      const stepY = ch + gap;

      let nx = Math.round(start.x + dx / stepX);
      let ny = Math.round(start.y + dy / stepY);
      nx = Math.max(0, Math.min(nx, cols - start.w));
      ny = Math.max(0, Math.min(ny, rows - start.h));

      const candidate: Pos = { x: nx, y: ny, w: start.w, h: start.h };
      const overlaps = state.instances.some(
        (i) => i.instanceId !== id && rectsOverlap(i.position, candidate)
      );
      setInvalidDrop(overlaps);
      setDropPreview(candidate);
    },
    [state, cellSize, cols, rows]
  );

  const onDragEnd = useCallback(
    (_event: DragEndEvent) => {
      if (activeId && dropPreview && !invalidDrop) {
        actions.updateInstance(activeId, { position: dropPreview });
      }
      setActiveId(null);
      setDropPreview(null);
      setInvalidDrop(false);
    },
    [activeId, dropPreview, invalidDrop, actions]
  );

  const handleSizeChange = useCallback(
    (instanceId: string, newSize: WidgetSize) => {
      if (!state) return;
      const span = WIDGET_SIZES[newSize];
      const inst = state.instances.find((i) => i.instanceId === instanceId);
      if (!inst) return;
      const others = state.instances
        .filter((i) => i.instanceId !== instanceId)
        .map((i) => i.position);

      const cx = Math.max(0, Math.min(inst.position.x, cols - span.w));
      const cy = Math.max(0, Math.min(inst.position.y, rows - span.h));
      const tryAt = (x: number, y: number) => {
        const candidate: Pos = { x, y, w: span.w, h: span.h };
        return others.some((o) => rectsOverlap(o, candidate)) ? null : candidate;
      };

      const fit =
        tryAt(cx, cy) ??
        (() => {
          const ff = findFirstFit(others, span.w, span.h, cols, rows);
          return ff ? { ...ff, w: span.w, h: span.h } : null;
        })();

      if (fit) {
        actions.updateInstance(instanceId, { size: newSize, position: fit });
      }
    },
    [state, actions, cols, rows]
  );

  const handleConfigChange = useCallback(
    (instanceId: string, config: Record<string, unknown>) => {
      actions.updateInstance(instanceId, { config });
    },
    [actions]
  );

  const handleRemove = useCallback(
    (instanceId: string) => {
      actions.removeInstance(instanceId);
    },
    [actions]
  );

  const handleDuplicate = useCallback(
    (instanceId: string) => {
      if (!state) return;
      const inst = state.instances.find((i) => i.instanceId === instanceId);
      if (!inst) return;
      const span = WIDGET_SIZES[inst.size];
      const taken = state.instances.map((i) => i.position);
      const ff = findFirstFit(taken, span.w, span.h, cols, rows);
      if (!ff) {
        console.warn("No fit for duplicate of", instanceId);
        return;
      }
      const newInst = createInstance(inst.widgetId, {
        size: inst.size,
        position: { ...ff, w: span.w, h: span.h },
        config: { ...inst.config },
      });
      actions.addInstance(newInst);
    },
    [state, actions, cols, rows]
  );

  // Session fetch is removed — user info is optional and not in scope here.
  // The header will not render user email to keep this self-contained.

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white/[0.06] border border-white/10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/60" />
          <span className="text-white/50 text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  const isNullState = state === null;
  const isEmpty = state !== null && state.instances.length === 0;
  const hasWidgets = state !== null && state.instances.length > 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-white">widget-box</h1>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors"
            >
              Marketplace
            </Link>
            {hasWidgets && (
              <button
                onClick={() => setEditMode((v) => !v)}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
                  editMode
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-white/5 border-white/15 text-white/70 hover:text-white hover:bg-white/10",
                ].join(" ")}
              >
                {editMode && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {editMode ? "Done" : "Edit"}
              </button>
            )}
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-white text-black px-3.5 py-1.5 text-xs font-semibold hover:bg-white/90 transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-8">
        {isNullState && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-md">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-blue-500/20">
                <span className="text-white font-bold text-2xl">W</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-3">Welcome to widget-box</h2>
              <p className="text-white/50 text-base leading-relaxed mb-8">
                Your personal dashboard for widgets that matter. Set up your space in minutes or browse what{"'"}s available.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/setup"
                  className="inline-flex items-center justify-center rounded-xl bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Get started
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white px-6 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  Browse widgets
                </Link>
              </div>
            </div>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-sm">
              <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Your dashboard is empty</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Add some widgets to make this space yours.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-xl bg-white text-black px-5 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
                >
                  Browse the marketplace
                </Link>
                <Link
                  href="/setup"
                  className="inline-flex items-center justify-center rounded-xl text-white/50 hover:text-white/80 px-5 py-2 text-sm transition-colors"
                >
                  Run setup again
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasWidgets && (
          <>
            {!editMode && (
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Widgets</h2>
                <p className="text-white/50 text-sm mt-1">Hover for size controls · Right-click for settings</p>
              </div>
            )}

            <DndContext
              sensors={sensors}
              onDragStart={editMode ? onDragStart : undefined}
              onDragMove={editMode ? onDragMove : undefined}
              onDragEnd={editMode ? onDragEnd : undefined}
            >
              <div
                className="widget-grid"
                ref={gridRef}
                style={
                  cols !== 5 || rows !== 5
                    ? {
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, minmax(110px, 1fr))`,
                      }
                    : undefined
                }
              >
                {dropPreview && editMode && (
                  <div
                    className={["drop-preview", invalidDrop && "drop-preview--invalid"]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      gridColumn: `${dropPreview.x + 1} / span ${dropPreview.w}`,
                      gridRow: `${dropPreview.y + 1} / span ${dropPreview.h}`,
                    }}
                  />
                )}

                {state.instances.map((inst) => {
                  const def = getWidgetById(inst.widgetId);
                  if (!def) return null;
                  return (
                    <WidgetTile
                      key={inst.instanceId}
                      widgetId={inst.widgetId}
                      instanceId={inst.instanceId}
                      title={def.meta.name}
                      subtitle={def.meta.provider}
                      size={inst.size}
                      initial={undefined}
                      initialConfig={inst.config}
                      position={inst.position}
                      isDraggable={editMode}
                      isResizable
                      editMode={editMode}
                      onSizeChange={(s) => handleSizeChange(inst.instanceId, s)}
                      onConfigChange={(cfg) => handleConfigChange(inst.instanceId, cfg)}
                      onRemove={() => handleRemove(inst.instanceId)}
                      onDuplicate={() => handleDuplicate(inst.instanceId)}
                    />
                  );
                })}
              </div>
            </DndContext>

            {editMode && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs">
                  Drag to rearrange · Right-click or click ⚙ for settings · Click "Done" to save
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
