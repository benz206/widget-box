"use client";
import { useMemo, useState, useEffect } from "react";
import WidgetShell from "./WidgetShell";
import WidgetSettingsPanel from "./WidgetSettingsPanel";
import { WidgetSize } from "@/lib/widgets/types";
import { getRenderer } from "./widgets/renderers";
import { getConfigFields, getAccent, getAllowedSizes } from "@/lib/widgets/registry";

type Props = {
  widgetId: string;
  instanceId: string;
  title: string;
  subtitle?: string;
  size: WidgetSize;
  initial: unknown;
  initialConfig: Record<string, unknown>;
  position?: { x: number; y: number; w: number; h: number };
  isDraggable?: boolean;
  isResizable?: boolean;
  editMode: boolean;
  onSizeChange?: (size: WidgetSize) => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

export default function WidgetTile({
  widgetId,
  instanceId,
  title,
  subtitle,
  size,
  initial,
  initialConfig,
  position,
  isDraggable = false,
  isResizable = false,
  editMode,
  onSizeChange,
  onConfigChange,
  onRemove,
  onDuplicate,
}: Props) {
  const [cfg, setCfg] = useState<Record<string, unknown>>(initialConfig);
  const [data, setData] = useState<unknown>(initial);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hadFirstLoad, setHadFirstLoad] = useState(false);

  const cfgString = useMemo(() => encodeURIComponent(JSON.stringify(cfg)), [cfg]);
  const Renderer = useMemo(() => getRenderer(widgetId), [widgetId]);
  const configFields = useMemo(() => getConfigFields(widgetId), [widgetId]);
  const accent = useMemo(() => getAccent(widgetId), [widgetId]);
  const allowedSizes = useMemo(() => getAllowedSizes(widgetId), [widgetId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/widgets/data?id=${encodeURIComponent(widgetId)}&cfg=${cfgString}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (active && json?.display !== undefined) {
          setData(json.display);
        }
      } catch (err) {
        console.error("widget load failed:", widgetId, err);
      } finally {
        if (active) setHadFirstLoad(true);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [widgetId, cfgString]);

  // per-second tick for clock and pomodoro
  useEffect(() => {
    const tick = widgetId === "system.clock" || widgetId === "system.pomodoro";
    if (!tick) return;
    const interval = setInterval(() => {
      fetch(`/api/widgets/data?id=${encodeURIComponent(widgetId)}&cfg=${cfgString}`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((j) => j?.display !== undefined && setData(j.display))
        .catch(() => {});
    }, 1000);
    return () => clearInterval(interval);
  }, [widgetId, cfgString]);

  function openPanel(x: number, y: number) {
    setPanelPos({ x, y });
    setPanelOpen(true);
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    openPanel(e.clientX, e.clientY);
  }

  function handleConfigChange(newCfg: Record<string, unknown>) {
    setCfg(newCfg);
    onConfigChange(newCfg);
  }

  return (
    <WidgetShell
      id={instanceId}
      title={title}
      subtitle={subtitle}
      size={size}
      position={position}
      onSizeChange={onSizeChange}
      isDraggable={isDraggable}
      isResizable={isResizable}
      onContextMenu={onContextMenu}
      accent={accent}
      editMode={editMode}
      onOpenSettings={() => openPanel(
        (position?.x ?? 0) * 100,
        (position?.y ?? 0) * 100
      )}
    >
      {!hadFirstLoad && !data ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white/60" />
        </div>
      ) : (
        <Renderer data={data} size={size} />
      )}
      {panelOpen && (
        <WidgetSettingsPanel
          widgetId={widgetId}
          instanceId={instanceId}
          title={title}
          accent={accent}
          size={size}
          config={cfg}
          fields={configFields}
          allowedSizes={allowedSizes}
          position={panelPos}
          onSizeChange={(s) => { onSizeChange?.(s); }}
          onConfigChange={handleConfigChange}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </WidgetShell>
  );
}
