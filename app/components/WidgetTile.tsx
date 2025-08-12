"use client";
import { useMemo, useState, useEffect } from "react";
import WidgetShell from "./WidgetShell";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  size: "small" | "medium" | "large" | "wide" | "tall";
  initial: any;
};

type ClockCfg = { timezone?: string; hour12?: boolean };
type WeatherCfg = { city?: string };

export default function WidgetTile({
  id,
  title,
  subtitle,
  size,
  initial,
}: Props) {
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [data, setData] = useState<any>(initial);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const cfgString = useMemo(
    () => encodeURIComponent(JSON.stringify(cfg)),
    [cfg]
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/widgets/data?id=${id}&cfg=${cfgString}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (active && json?.display !== undefined) setData(json.display);
      } catch {}
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
      <WidgetShell title={title} subtitle={subtitle} size={size}>
        <WidgetBody id={id} data={data} />
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
        <div className="text-5xl md:text-6xl font-semibold tracking-tight">
          {d.display}
        </div>
      );
    }
    case "system.weather.simple": {
      const d = data as { city: string; tempC: number; condition: string };
      return (
        <div className="flex flex-col items-center justify-center text-center gap-1">
          <div className="text-4xl md:text-5xl font-semibold">
            {Math.round(d.tempC)}°
          </div>
          <div className="text-xs opacity-80">{d.condition}</div>
          <div className="text-[10px] opacity-60">{d.city}</div>
        </div>
      );
    }
    default:
      return <div className="text-sm opacity-80">Unknown</div>;
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
      className="fixed z-50 min-w-56 rounded-xl border border-white/20 bg-white/20 backdrop-blur-xl shadow-xl p-3 text-sm"
      style={{ left: pos.x + 6, top: pos.y + 6 }}
    >
      {id === "system.time.simple" && (
        <div className="space-y-3">
          <div className="font-semibold">Clock options</div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(cfg.hour12)}
              onChange={(e) => setCfg({ ...cfg, hour12: e.target.checked })}
            />
            12‑hour format
          </label>
          <div className="flex items-center gap-2">
            <span>Timezone:</span>
            <input
              className="px-2 py-1 rounded bg-white/30"
              placeholder="e.g. America/Toronto"
              value={cfg.timezone ?? ""}
              onChange={(e) => setCfg({ ...cfg, timezone: e.target.value })}
            />
          </div>
        </div>
      )}
      {id === "system.weather.simple" && (
        <div className="space-y-3">
          <div className="font-semibold">Weather options</div>
          <div className="flex items-center gap-2">
            <span>City:</span>
            <input
              className="px-2 py-1 rounded bg-white/30"
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
