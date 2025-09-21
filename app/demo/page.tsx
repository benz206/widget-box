"use client";
import React, { useState } from "react";

// Mock the types and constants since we don't have access to your lib
const WIDGET_SIZES = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 2 },
  large: { w: 3, h: 3 },
  xlarge: { w: 4, h: 4 },
} as const;

type WidgetSize = keyof typeof WIDGET_SIZES;

// Simple drag implementation without @dnd-kit dependency
function useDraggable({ id }: { id: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [transform, setTransform] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setTransform({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTransform(null);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return {
    isDragging,
    transform,
    setNodeRef: React.useCallback((_node: HTMLElement | null) => {}, []),
    listeners: { onMouseDown: handleMouseDown },
    attributes: { "data-draggable": true },
  } as const;
}

type WidgetShellProps = {
  id: string;
  title?: string;
  subtitle?: string;
  size: WidgetSize;
  position?: { x: number; y: number; w: number; h: number };
  children: React.ReactNode;
  onSizeChange?: (size: WidgetSize) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
};

const getGridClasses = (w: number, h: number) => {
  const colSpan =
    w === 1
      ? "col-span-1"
      : w === 2
      ? "col-span-2"
      : w === 3
      ? "col-span-3"
      : w === 4
      ? "col-span-4"
      : "col-span-5";
  const rowSpan =
    h === 1
      ? "row-span-1"
      : h === 2
      ? "row-span-2"
      : h === 3
      ? "row-span-3"
      : h === 4
      ? "row-span-4"
      : "row-span-5";
  return `${colSpan} ${rowSpan}`;
};

export function WidgetShell({
  id,
  title,
  subtitle,
  size,
  position,
  children,
  onSizeChange,
  isDraggable = false,
  isResizable = false,
  onContextMenu,
  onPositionChange,
}: WidgetShellProps) {
  const sizeConfig = WIDGET_SIZES[size];
  const w = position?.w ?? sizeConfig.w;
  const h = position?.h ?? sizeConfig.h;
  const gridClasses = getGridClasses(w, h);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  React.useEffect(() => {
    if (!isDragging && transform && onPositionChange) {
      const gridSize = 100;
      const newX = Math.round(transform.x / gridSize);
      const newY = Math.round(transform.y / gridSize);
      onPositionChange({ x: Math.max(0, newX), y: Math.max(0, newY) });
    }
  }, [isDragging, transform, onPositionChange]);

  const style: React.CSSProperties = {
    gridColumn: position ? `${position.x + 1} / span ${w}` : undefined,
    gridRow: position ? `${position.y + 1} / span ${h}` : undefined,
    minHeight: 0,
    ...(transform && isDragging
      ? {
          position: "fixed",
          left: transform.x,
          top: transform.y,
          zIndex: 1000,
          width: `${w * 100}px`,
          height: `${h * 100}px`,
          pointerEvents: "none",
        }
      : {}),
  };

  return (
    <div
      className={[
        "relative",
        !isDragging && gridClasses,
        isDraggable && "cursor-move",
        "transition-all duration-200",
        isDragging && "z-50",
        "h-full w-full min-h-0 touch-none",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      ref={setNodeRef}
      {...(isDraggable ? (listeners as any) : {})}
      {...(isDraggable ? (attributes as any) : {})}
      onContextMenu={onContextMenu}
    >
      <section
        className={[
          "group relative overflow-hidden rounded-2xl h-full w-full",
          "bg-white/5 backdrop-blur-xl border border-white/10",
          isDragging
            ? "shadow-2xl shadow-black/40 scale-105"
            : "shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30",
          isDragging
            ? ""
            : "hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300",
          "p-4 flex flex-col",
          isDraggable && "select-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-1/2 -left-1/3 h-[200%] w-[200%] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        {(title || subtitle) && (
          <header className="z-10 flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-white mb-1 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-white/60 truncate">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isResizable && (
                <div className="flex space-x-1">
                  {Object.entries(WIDGET_SIZES).map(([sizeKey, sizeCfg]) => (
                    <button
                      key={sizeKey}
                      onClick={() => onSizeChange?.(sizeKey as WidgetSize)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        size === sizeKey
                          ? "bg-white/60"
                          : "bg-white/20 hover:bg-white/40"
                      }`}
                      title={`${sizeKey} (${sizeCfg.w}x${sizeCfg.h})`}
                    />
                  ))}
                </div>
              )}
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
            </div>
          </header>
        )}

        <div className="z-10 flex-1 flex items-center justify-center relative">
          {children}
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </section>
    </div>
  );
}

function ClockWidget({ data }: { data?: any }) {
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
        {data?.display || currentTime}
      </div>
      <div className="text-xs text-white/60 font-medium">Local Time</div>
    </div>
  );
}

function WeatherWidget({ data }: { data?: any }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2">
      <div className="text-2xl md:text-3xl font-bold text-white">
        {Math.round(data?.tempC || 22)}°
      </div>
      <div className="text-sm text-white/80 font-medium">
        {data?.condition || "Sunny"}
      </div>
      <div className="text-xs text-white/60">{data?.city || "San Francisco"}</div>
    </div>
  );
}

function DashboardDemo() {
  const [widgets, setWidgets] = useState(
    [
      {
        id: "clock-1",
        type: "clock",
        title: "Local Time",
        subtitle: "San Francisco",
        size: "medium" as WidgetSize,
        position: { x: 0, y: 0, w: 2, h: 2 },
      },
      {
        id: "weather-1",
        type: "weather",
        title: "Weather",
        subtitle: "Current conditions",
        size: "medium" as WidgetSize,
        position: { x: 2, y: 0, w: 2, h: 2 },
      },
      {
        id: "clock-2",
        type: "clock",
        title: "UTC Time",
        subtitle: "Coordinated Universal Time",
        size: "small" as WidgetSize,
        position: { x: 0, y: 2, w: 1, h: 1 },
      },
      {
        id: "weather-2",
        type: "weather",
        title: "Tomorrow",
        subtitle: "Weather forecast",
        size: "large" as WidgetSize,
        position: { x: 1, y: 2, w: 3, h: 3 },
      },
    ] as const
  );

  const updateWidgetPosition = (
    widgetId: string,
    newPosition: { x: number; y: number }
  ) => {
    setWidgets((prev: any) =>
      prev.map((widget: any) =>
        widget.id === widgetId
          ? { ...widget, position: { ...widget.position, ...newPosition } }
          : widget
      )
    );
  };

  const updateWidgetSize = (widgetId: string, newSize: WidgetSize) => {
    setWidgets((prev: any) =>
      prev.map((widget: any) =>
        widget.id === widgetId ? { ...widget, size: newSize } : widget
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-white/60">Drag widgets to rearrange • Right-click for options</p>
        </header>

        <div className="grid grid-cols-5 grid-rows-5 gap-4 h-[600px] relative">
          {widgets.map((widget: any) => (
            <WidgetShell
              key={widget.id}
              id={widget.id}
              title={widget.title}
              subtitle={widget.subtitle}
              size={widget.size}
              position={widget.position}
              isDraggable={true}
              isResizable={true}
              onPositionChange={(newPos) => updateWidgetPosition(widget.id, newPos)}
              onSizeChange={(newSize) => updateWidgetSize(widget.id, newSize)}
            >
              {widget.type === "clock" ? (
                <ClockWidget data={{}} />
              ) : widget.type === "weather" ? (
                <WeatherWidget data={{}} />
              ) : (
                <div className="text-white/60">Unknown widget</div>
              )}
            </WidgetShell>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white/5 backdrop-blur rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Click and drag widgets to move them around</li>
            <li>• Hover over widgets to see size controls</li>
            <li>• Widgets snap to grid positions when dropped</li>
            <li>• Visual feedback shows when dragging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardDemo;


