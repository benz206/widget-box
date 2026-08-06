"use client";

import { useMemo, useState } from "react";
import WidgetFrame from "./WidgetFrame";
import WidgetSettingsPanel from "./WidgetSettingsPanel";
import { getWidgetById, resolveConfig } from "@/lib/widgets/registry";
import type { WidgetInstance } from "@/lib/storage/dashboard";
import type { WidgetSize } from "@/lib/widgets/types";

type Props = {
  instance: WidgetInstance;
  editMode: boolean;
  draggable: boolean;
  onSizeChange: (size: WidgetSize) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

export default function WidgetTile({
  instance,
  editMode,
  draggable,
  onSizeChange,
  onConfigChange,
  onRemove,
  onDuplicate,
}: Props) {
  const [settingsAnchor, setSettingsAnchor] = useState<{ x: number; y: number } | null>(
    null
  );

  const definition = getWidgetById(instance.widgetId);
  const config = useMemo(
    () => resolveConfig(instance.widgetId, instance.config),
    [instance.widgetId, instance.config]
  );

  if (!definition) return null;
  const { View } = definition;

  return (
    <WidgetFrame
      id={instance.instanceId}
      position={instance.position}
      editMode={editMode}
      draggable={draggable}
      onRemove={onRemove}
      onOpenSettings={setSettingsAnchor}
    >
      <View
        instanceId={instance.instanceId}
        size={instance.size}
        config={config}
      />

      {settingsAnchor && (
        <WidgetSettingsPanel
          widgetId={instance.widgetId}
          size={instance.size}
          config={config}
          anchor={settingsAnchor}
          onSizeChange={onSizeChange}
          onConfigChange={onConfigChange}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onClose={() => setSettingsAnchor(null)}
        />
      )}
    </WidgetFrame>
  );
}
