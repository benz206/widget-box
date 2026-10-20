"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import Icon from "./ui/Icon";
import { buttonClass } from "./ui/Button";
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

function ToolbarButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: "trash" | "gear";
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
      className={buttonClass({ variant: "ghost", size: "sm", iconOnly: true })}
    >
      <Icon name={icon} size={14} />
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
        "grid-item relative",
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
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
          transition: isDragging ? "none" : "transform 260ms var(--ease-ios)",
        } as React.CSSProperties
      }
      data-editing={editMode || undefined}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      onContextMenu={(e) => {
        // Leave the native menu alone over anything the widget made editable.
        if ((e.target as HTMLElement).closest("input, textarea, select, a, button")) {
          return;
        }
        e.preventDefault();
        onOpenSettings({ x: e.clientX, y: e.clientY });
      }}
    >
      {editMode && (
        <div className="tile-toolbar">
          <ToolbarButton
            label="Widget settings"
            icon="gear"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onOpenSettings({ x: rect.right, y: rect.bottom });
            }}
          />
          <ToolbarButton label="Remove widget" icon="trash" onClick={onRemove} />
        </div>
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
