"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";
import WidgetTile from "./components/WidgetTile";
import { WIDGET_SIZES } from "@/lib/widgets/types";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
  useDroppable,
  pointerWithin,
} from "@dnd-kit/core";

registerSystemWidgets();

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetsWithData, setWidgetsWithData] = useState<any[]>([]);
  const [widgetPositions, setWidgetPositions] = useState<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const [dropPreview, setDropPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [invalidDrop, setInvalidDrop] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load session and widgets on client side
    const loadData = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        const widgetsList = listWidgets();
        setWidgets(widgetsList);

        // Fetch data for each widget (simple defaults)
        const widgetsWithData = await Promise.all(
          widgetsList.map(async (w) => {
            const data = await w.fetchData({} as any, { now: new Date() });
            const display = w.toDisplay
              ? w.toDisplay(data as any)
              : (data as any);
            return { def: w, display } as const;
          })
        );
        setWidgetsWithData(widgetsWithData);

        // Initialize positions
        const initialPositions: Record<string, { x: number; y: number; w: number; h: number }> = {};
        widgetsList.forEach((w, index) => {
          const sizeKey = w.meta.size as keyof typeof WIDGET_SIZES;
          const span = WIDGET_SIZES[sizeKey] ?? { w: 1, h: 1 };
          initialPositions[w.meta.id] = {
            x: index % 5,
            y: Math.floor(index / 5),
            w: span.w,
            h: span.h,
          };
        });
        setWidgetPositions(initialPositions);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const COLS = 5;
  const ROWS = 5;
  const cells = useMemo(() => {
    const items: { x: number; y: number; id: string }[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        items.push({ x, y, id: `cell-${x}-${y}` });
      }
    }
    return items;
  }, []);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      setActiveId(id);
      const pos = widgetPositions[id] || { x: 0, y: 0 };
      setDropPreview({ x: pos.x, y: pos.y });
    },
    [widgetPositions]
  );

  const onDragMove = useCallback(
    (event: DragMoveEvent) => {
      if (!event.over) return;
      const overId = String(event.over.id);
      if (overId.startsWith("cell-")) {
        const [, xs, ys] = overId.split("-");
        let x = parseInt(xs, 10);
        let y = parseInt(ys, 10);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          const span =
            activeId && widgetPositions[activeId]
              ? {
                  w: widgetPositions[activeId].w ?? 1,
                  h: widgetPositions[activeId].h ?? 1,
                }
              : { w: 1, h: 1 };
          const cols = 5;
          const rows = 5;
          x = Math.max(0, Math.min(x, cols - span.w));
          y = Math.max(0, Math.min(y, rows - span.h));
          // detect overlap with other widgets
          let overlaps = false;
          if (activeId) {
            const ax1 = x;
            const ay1 = y;
            const ax2 = x + span.w;
            const ay2 = y + span.h;
            for (const [id, pos] of Object.entries(widgetPositions)) {
              if (id === activeId) continue;
              const bx1 = pos.x;
              const by1 = pos.y;
              const bx2 = pos.x + (pos.w ?? 1);
              const by2 = pos.y + (pos.h ?? 1);
              if (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1) {
                overlaps = true;
                break;
              }
            }
          }
          setInvalidDrop(overlaps);
          setDropPreview({ x, y });
        }
      }
    },
    [activeId, widgetPositions]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const id = String(event.active.id);
      if (dropPreview && !invalidDrop) {
        const span = widgetPositions[id]
          ? { w: widgetPositions[id].w ?? 1, h: widgetPositions[id].h ?? 1 }
          : { w: 1, h: 1 };
        const cols = 5;
        const rows = 5;
        const clampedX = Math.max(0, Math.min(dropPreview.x, cols - span.w));
        const clampedY = Math.max(0, Math.min(dropPreview.y, rows - span.h));
        setWidgetPositions((prev) => ({
          ...prev,
          [id]: {
            ...(prev[id] ?? { w: 1, h: 1 }),
            x: clampedX,
            y: clampedY,
          },
        }));
      }
      setDropPreview(null);
      setInvalidDrop(false);
      setActiveId(null);
    },
    [dropPreview, invalidDrop, widgetPositions]
  );

  const user = session?.user;

  return (
    <div className="min-h-screen">
      {/* Modern sticky header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                widget-box
              </h1>
            </div>
          </div>

          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-white/90">
                    {user.email}
                  </span>
                </div>
                <button className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                  Settings
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold shadow-lg hover:bg-white/90 transition-all duration-200 hover:shadow-xl"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
            Your Dashboard
          </h2>
          <p className="text-white/60 text-lg">
            Manage your widgets and customize your workspace
          </p>
        </div>

        {widgetsWithData.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
          >
            <div className="widget-grid" ref={gridRef}>
              {/* Droppable cells overlay */}
              {cells.map((c) => (
                <DroppableCell key={c.id} id={c.id} x={c.x} y={c.y} />
              ))}
              {/* Render drop preview */}
              {dropPreview && (
                <div
                  className={["drop-preview", invalidDrop && "drop-preview--invalid"].filter(Boolean).join(" ")}
                  style={{
                    gridColumn: `${dropPreview.x + 1} / span ${
                      (activeId && widgetPositions[activeId]?.w) || 1
                    }`,
                    gridRow: `${dropPreview.y + 1} / span ${
                      (activeId && widgetPositions[activeId]?.h) || 1
                    }`,
                  }}
                />
              )}

              {widgetsWithData.map(({ def, display }, index) => (
                <WidgetTile
                  key={def.meta.id}
                  id={def.meta.id}
                  title={def.meta.name}
                  subtitle={def.meta.provider}
                  size={def.meta.size as any}
                  initial={display}
                  position={
                    widgetPositions[def.meta.id] || {
                      x: index % 5,
                      y: Math.floor(index / 5),
                      w: (WIDGET_SIZES[def.meta.size as keyof typeof WIDGET_SIZES]?.w ?? 1),
                      h: (WIDGET_SIZES[def.meta.size as keyof typeof WIDGET_SIZES]?.h ?? 1),
                    }
                  }
                  isDraggable={true}
                  isResizable={true}
                  onSizeChange={(newSize) => {
                    const span =
                      WIDGET_SIZES[newSize as keyof typeof WIDGET_SIZES] ??
                      { w: 1, h: 1 };
                    setWidgetPositions((prev) => {
                      const curr = prev[def.meta.id] ?? {
                        x: index % 5,
                        y: Math.floor(index / 5),
                        w: 1,
                        h: 1,
                      };
                      // clamp within bounds
                      const cols = 5;
                      const rows = 5;
                      const clampedX = Math.max(0, Math.min(curr.x, cols - span.w));
                      const clampedY = Math.max(0, Math.min(curr.y, rows - span.h));
                      // check overlap; if overlap, skip size change
                      const ax1 = clampedX;
                      const ay1 = clampedY;
                      const ax2 = clampedX + span.w;
                      const ay2 = clampedY + span.h;
                      let overlaps = false;
                      for (const [otherId, pos] of Object.entries(prev)) {
                        if (otherId === def.meta.id) continue;
                        const bx1 = pos.x;
                        const by1 = pos.y;
                        const bx2 = pos.x + (pos.w ?? 1);
                        const by2 = pos.y + (pos.h ?? 1);
                        if (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1) {
                          overlaps = true;
                          break;
                        }
                      }
                      if (overlaps) return prev; // no-op if invalid
                      return {
                        ...prev,
                        [def.meta.id]: {
                          ...curr,
                          x: clampedX,
                          y: clampedY,
                          w: span.w,
                          h: span.h,
                        },
                      };
                    });
                  }}
                />
              ))}
            </div>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in">
            <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 animate-scale-in">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              No widgets available
            </h3>
            <p className="text-white/60 max-w-md text-center">
              It looks like there are no widgets configured yet. Check back
              later or contact your administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Preview({ meta }: { meta: { name: string; desc?: string } }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-semibold tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,.4)]">
        {meta.name}
      </div>
      {meta.desc && (
        <div className="text-xs mt-1 opacity-80 max-w-[18ch]">{meta.desc}</div>
      )}
    </div>
  );
}

function DroppableCell({ id, x, y }: { id: string; x: number; y: number }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `${x + 1} / span 1`,
        gridRow: `${y + 1} / span 1`,
      }}
    />
  );
}
