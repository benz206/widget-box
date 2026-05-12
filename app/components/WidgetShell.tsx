"use client";
import React from "react";
import { WidgetSize, WIDGET_SIZES } from "@/lib/widgets/types";
import { useDraggable } from "@dnd-kit/core";

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
  accent?: string;
  editMode?: boolean;
  onOpenSettings?: () => void;
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
  accent = "#60a5fa",
  editMode = false,
  onOpenSettings,
}: WidgetShellProps) {
  const sizeConfig = WIDGET_SIZES[size];
  const w = position?.w ?? sizeConfig.w;
  const h = position?.h ?? sizeConfig.h;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style: React.CSSProperties = {
    gridColumn: position ? `${position.x + 1} / span ${w}` : undefined,
    gridRow: position ? `${position.y + 1} / span ${h}` : undefined,
    minHeight: 0,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <div
      className={[
        "relative h-full w-full min-h-0 touch-none",
        isDraggable && "cursor-grab active:cursor-grabbing",
        isDragging && "z-50 widget-dragging",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      ref={setNodeRef}
      {...(isDraggable ? listeners : {})}
      {...(isDraggable ? attributes : {})}
      onContextMenu={onContextMenu}
    >
      <section
        className={[
          "group relative overflow-hidden rounded-2xl h-full w-full",
          "bg-white/[0.06] backdrop-blur-xl border border-white/10",
          "shadow-xl shadow-black/20",
          isDragging ? "" : "hover:border-white/20",
          "p-3 flex flex-col",
          isDraggable && "select-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* glossy top sheen */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div
            className="absolute -top-12 -left-8 h-24 w-32 rounded-full blur-2xl opacity-50"
            style={{ background: accent }}
            aria-hidden
          />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <header className="z-10 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
              />
              {title && (
                <h3 className="text-[10px] font-semibold tracking-widest uppercase text-white/70 truncate">
                  {title}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editMode && onOpenSettings && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
                  className="w-5 h-5 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors text-[10px]"
                  title="Settings"
                >
                  ⚙
                </button>
              )}
              {isResizable && (
                <div className="flex gap-1">
                  {Object.entries(WIDGET_SIZES).map(([sizeKey]) => (
                    <button
                      key={sizeKey}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSizeChange?.(sizeKey as WidgetSize);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        size === sizeKey ? "bg-white/80" : "bg-white/25 hover:bg-white/50"
                      }`}
                      title={sizeKey}
                    />
                  ))}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Body */}
        <div className="z-10 flex-1 flex items-center justify-center relative mt-2">
          {children}
        </div>
      </section>
    </div>
  );
}

export default WidgetShell;
