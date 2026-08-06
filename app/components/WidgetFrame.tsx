"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import Icon from "./ui/Icon";
import type { WidgetPosition } from "@/lib/widgets/types";

type Props = {
  id: string;
  position: WidgetPosition;
  children: React.ReactNode;
  editMode: boolean;
  draggable: boolean;
  onRemove: () => void;
  onOpenSettings: (anchor: { x: number; y: number }) => void;
};

function CornerButton({
  label,
  icon,
  className,
  onClick,
}: {
  label: string;
  icon: "minus" | "gear";
  className: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className={`press focus-ring material hairline absolute z-20 flex h-6 w-6 items-center justify-center rounded-full text-label shadow-sm ${className}`}
    >
      <Icon name={icon} size={13} strokeWidth={2.4} />
    </button>
  );
}

export default function WidgetFrame({
  id,
  position,
  children,
  editMode,
  draggable,
  onRemove,
  onOpenSettings,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        "grid-item group relative",
        editMode && !isDragging && "jiggle",
        draggable && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-50",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--gx": position.x + 1,
          "--gy": position.y + 1,
          "--gw": position.w,
          "--gh": position.h,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.04)`
            : undefined,
          transition: isDragging ? "none" : "transform 260ms var(--ease-ios)",
        } as React.CSSProperties
      }
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
    >
      {editMode && (
        <>
          <CornerButton
            label="Remove widget"
            icon="minus"
            className="-left-1.5 -top-1.5"
            onClick={onRemove}
          />
          <CornerButton
            label="Widget settings"
            icon="gear"
            className="-right-1.5 -top-1.5"
            onClick={(e) =>
              onOpenSettings({
                x: e.currentTarget.getBoundingClientRect().right,
                y: e.currentTarget.getBoundingClientRect().bottom,
              })
            }
          />
        </>
      )}

      <section
        className="material hairline rounded-tile squircle relative h-full w-full overflow-hidden"
        style={{
          ["--tile-pad" as string]: "16px",
          padding: "var(--tile-pad)",
          boxShadow: isDragging ? "var(--tile-shadow-lifted)" : "var(--tile-shadow)",
          transition: "box-shadow 260ms var(--ease-ios)",
        }}
      >
        {/* Top highlight, the way a physical material catches light. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "var(--tile-highlight)" }}
        />
        {/* In edit mode the tile is a drag handle, so its contents go inert. */}
        <div className="relative h-full w-full" inert={editMode}>
          {children}
        </div>
      </section>
    </div>
  );
}
