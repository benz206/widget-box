"use client";
import React from "react";
import { WidgetSize, WIDGET_SIZES } from "@/lib/widgets/types";

type WidgetShellProps = {
  title?: string;
  subtitle?: string;
  size: WidgetSize;
  position?: { x: number; y: number; w: number; h: number };
  children: React.ReactNode;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (size: WidgetSize) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
};

// Convert grid dimensions to Tailwind classes for 5x5 grid
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
  title,
  subtitle,
  size,
  position,
  children,
  onPositionChange,
  onSizeChange,
  isDraggable = false,
  isResizable = false,
}: WidgetShellProps) {
  const sizeConfig = WIDGET_SIZES[size];
  const w = position?.w ?? sizeConfig.w;
  const h = position?.h ?? sizeConfig.h;
  const gridClasses = getGridClasses(w, h);

  return (
    <div
      className={[
        "relative",
        gridClasses,
        isDraggable && "cursor-move",
        "transition-all duration-200",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        gridColumn: position ? `${position.x + 1} / span ${w}` : undefined,
        gridRow: position ? `${position.y + 1} / span ${h}` : undefined,
      }}
    >
      <section
        className={[
          "group relative overflow-hidden rounded-2xl h-full w-full",
          "bg-white/5 backdrop-blur-xl border border-white/10",
          "shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30",
          "hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300",
          "p-4 flex flex-col",
          isDraggable && "select-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-1/2 -left-1/3 h-[200%] w-[200%] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        {/* Header with improved typography */}
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
            {/* Widget controls */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isResizable && (
                <div className="flex space-x-1">
                  {Object.entries(WIDGET_SIZES).map(([sizeKey, sizeConfig]) => (
                    <button
                      key={sizeKey}
                      onClick={() => onSizeChange?.(sizeKey as WidgetSize)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        size === sizeKey
                          ? "bg-white/60"
                          : "bg-white/20 hover:bg-white/40"
                      }`}
                      title={`${sizeKey} (${sizeConfig.w}x${sizeConfig.h})`}
                    />
                  ))}
                </div>
              )}
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
            </div>
          </header>
        )}

        {/* Content area with better spacing */}
        <div className="z-10 flex-1 flex items-center justify-center relative">
          {children}
        </div>

        {/* Subtle hover effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </section>
    </div>
  );
}

export default WidgetShell;
