import React, { useLayoutEffect, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import Icon from "./ui/Icon";
import { buttonClass } from "./ui/Button";
import type { WidgetPosition } from "@/lib/widgets/types";

type Props = {
  id: string;
  label: string;
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
  label,
  position,
  children,
  editMode,
  draggable,
  onRemove,
  onOpenSettings,
}: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: !draggable,
  });
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const last = useRef<{ rect: DOMRect; cell: string } | null>(null);
  const cell = `${position.x},${position.y},${position.w},${position.h}`;

  useLayoutEffect(() => {
    const el = nodeRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const prev = last.current;
    last.current = { rect, cell };
    if (!prev || prev.cell === cell || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dx = prev.rect.left - rect.left;
    const dy = prev.rect.top - rect.top;
    const resized = Math.abs(prev.rect.width - rect.width) > 1 || Math.abs(prev.rect.height - rect.height) > 1;
    el.animate(
      resized
        ? [{ transform: `translate(${dx}px, ${dy}px) scale(0.94)`, opacity: 0.4 }, { transform: "none", opacity: 1 }]
        : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
      { duration: 460, easing: "cubic-bezier(0.32, 0.72, 0, 1)" }
    );
  });

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
        nodeRef.current = node;
      }}
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
      aria-label={draggable ? label : undefined}
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
          transition:
            "box-shadow 260ms var(--ease-ios), transform 260ms var(--ease-ios), background-color 240ms linear",
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
