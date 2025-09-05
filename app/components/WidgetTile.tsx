"use client";
import { useMemo, useState, useEffect } from "react";
import WidgetShell from "./WidgetShell";

import { WidgetSize } from "@/lib/widgets/types";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  size: WidgetSize;
  initial: any;
  position?: { x: number; y: number; w: number; h: number };
  isDraggable?: boolean;
  isResizable?: boolean;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (size: WidgetSize) => void;
};

type ClockCfg = { timezone?: string; hour12?: boolean };
type WeatherCfg = { city?: string };

export default function WidgetTile({
  id,
  title,
  subtitle,
  size,
  initial,
  position,
  isDraggable = false,
  isResizable = false,
  onPositionChange,
  onSizeChange,
}: Props) {
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [data, setData] = useState<any>(initial);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cfgString = useMemo(
    () => encodeURIComponent(JSON.stringify(cfg)),
    [cfg]
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/widgets/data?id=${id}&cfg=${cfgString}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (active && json?.display !== undefined) {
          setData(json.display);
        }
      } catch (error) {
        console.error("Failed to load widget data:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, cfgString]);

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  return (
    <div onContextMenu={onContextMenu} className="relative">
      <WidgetShell
        title={title}
        subtitle={subtitle}
        size={size}
        position={position}
        onPositionChange={onPositionChange}
        onSizeChange={onSizeChange}
        isDraggable={isDraggable}
        isResizable={isResizable}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white/60"></div>
          </div>
        ) : (
          <WidgetBody id={id} data={data} />
        )}
      </WidgetShell>
      {menuOpen && menuPos && (
        <ContextMenu
          id={id}
          pos={menuPos}
          cfg={cfg}
          setCfg={setCfg}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

function WidgetBody({ id, data }: { id: string; data: any }) {
  switch (id) {
    case "system.time.simple": {
      const d = data as { display: string };
      return (
        <div className="text-center">
          <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            {d.display}
          </div>
          <div className="text-xs text-white/60 font-medium">Local Time</div>
        </div>
      );
    }
    case "system.weather.simple": {
      const d = data as { city: string; tempC: number; condition: string };
      return (
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="text-3xl md:text-4xl font-bold text-white">
            {Math.round(d.tempC)}°
          </div>
          <div className="text-sm text-white/80 font-medium">{d.condition}</div>
          <div className="text-xs text-white/60">{d.city}</div>
        </div>
      );
    }
    default:
      return (
        <div className="text-center">
          <div className="text-sm text-white/60">Unknown Widget</div>
        </div>
      );
  }
}

function ContextMenu({
  id,
  pos,
  cfg,
  setCfg,
  onClose,
}: {
  id: string;
  pos: { x: number; y: number };
  cfg: Record<string, any>;
  setCfg: (v: Record<string, any>) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onDoc = () => onClose();
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 min-w-64 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-4 text-sm animate-in fade-in"
      style={{
        left: Math.min(pos.x + 8, window.innerWidth - 280),
        top: Math.min(pos.y + 8, window.innerHeight - 200),
      }}
    >
      {id === "system.time.simple" && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-blue-400"></div>
            <h3 className="font-semibold text-white">Clock Settings</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={Boolean(cfg.hour12)}
                onChange={(e) => setCfg({ ...cfg, hour12: e.target.checked })}
                className="w-4 h-4 rounded border-2 border-white/30 bg-transparent text-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
              />
              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                12-hour format
              </span>
            </label>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
                Timezone
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="e.g. America/Toronto"
                value={cfg.timezone ?? ""}
                onChange={(e) => setCfg({ ...cfg, timezone: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {id === "system.weather.simple" && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-orange-400"></div>
            <h3 className="font-semibold text-white">Weather Settings</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
              City
            </label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              placeholder="e.g. Waterloo"
              value={cfg.city ?? ""}
              onChange={(e) => setCfg({ ...cfg, city: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
