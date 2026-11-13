import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./ui/Button";
import ConfigForm from "./ui/ConfigForm";
import Field from "./ui/Field";
import Icon from "./ui/Icon";
import Segmented from "./ui/Segmented";
import { CATEGORY_LABELS, getConfigFields, getWidgetById } from "@/lib/widgets/registry";
import { SIZE_LABELS, type WidgetSize } from "@/lib/widgets/types";

const WIDTH = 300;
const MARGIN = 12;

type Props = {
  widgetId: string;
  size: WidgetSize;
  config: Record<string, unknown>;
  anchor: { x: number; y: number };
  onSizeChange: (size: WidgetSize) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onClose: () => void;
};

export default function WidgetSettingsPanel({
  widgetId,
  size,
  config,
  anchor,
  onSizeChange,
  onConfigChange,
  onRemove,
  onDuplicate,
  onClose,
}: Props) {
  const panelRef = useRef<HTMLDialogElement>(null);
  const [placement, setPlacement] = useState({ left: anchor.x, top: anchor.y });
  const definition = getWidgetById(widgetId);
  const fields = getConfigFields(widgetId);

  useLayoutEffect(() => {
    panelRef.current?.showPopover();
  }, []);

  // Keep the popover fully on screen, flipping above the anchor if needed.
  useLayoutEffect(() => {
    const height = panelRef.current?.offsetHeight ?? 320;
    setPlacement({
      left: Math.max(
        MARGIN,
        Math.min(anchor.x - WIDTH, window.innerWidth - WIDTH - MARGIN)
      ),
      top:
        anchor.y + height + MARGIN > window.innerHeight
          ? Math.max(MARGIN, window.innerHeight - height - MARGIN)
          : anchor.y + 6,
    });
  }, [anchor.x, anchor.y]);

  if (!definition) return null;
  const sizes = definition.meta.sizes;

  // Portalled to the body: while the dashboard is in edit mode the tile's
  // contents are inert, and a popover nested inside would inherit that.
  return createPortal(
    <dialog
      ref={panelRef}
      popover="auto"
      aria-label={`${definition.meta.name} settings`}
      className="animate-sheet-in card fixed open:flex flex-col"
      style={{
        left: placement.left,
        top: placement.top,
        width: WIDTH,
        maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
        boxShadow: "var(--tile-shadow-lifted)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onToggle={(e) => e.newState === "closed" && onClose()}
    >
      <header className="flex items-center gap-3 border-b border-separator px-4 py-3">
        <span className="icon-tile" style={{ ["--tile-accent" as string]: definition.meta.accent }}>
          <Icon name={definition.meta.icon} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-semibold">{definition.meta.name}</h2>
          <p className="truncate text-[12px] text-secondary">
            {CATEGORY_LABELS[definition.meta.category]}
          </p>
        </div>
        <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Close">
          <Icon name="xmark" size={14} />
        </Button>
      </header>

      <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
        {sizes.length > 1 && (
          <Field label="Size" group>
            <Segmented
              options={sizes.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
              value={size}
              onChange={onSizeChange}
              size="sm"
              className="w-full"
            />
          </Field>
        )}

        {fields.length > 0 && (
          <ConfigForm
            fields={fields}
            config={config}
            onChange={(key, value) => onConfigChange({ ...config, [key]: value })}
          />
        )}
      </div>

      <footer className="flex justify-between gap-2 border-t border-separator px-4 py-3">
        <Button
          size="sm"
          variant="danger"
          onClick={() => {
            onRemove();
            onClose();
          }}
        >
          <Icon name="trash" size={14} />
          Remove
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onDuplicate();
            onClose();
          }}
        >
          <Icon name="duplicate" size={14} />
          Duplicate
        </Button>
      </footer>
    </dialog>,
    document.body
  );
}
