"use client";
import React, { useEffect, useState } from "react";
import { WidgetCategory, WidgetSize } from "@/lib/widgets/types";
import { getWidgetById } from "@/lib/widgets/registry";
import { getRenderer } from "@/app/components/widgets/renderers";

export type WidgetCardProps = {
  widgetId: string;
  name: string;
  summary?: string;
  category: WidgetCategory;
  accent: string;
  tags?: string[];
  installedCount: number;
  previewSize?: WidgetSize;
  onClick: () => void;
};

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  productivity: "Productivity",
  information: "Information",
  lifestyle: "Lifestyle",
  finance: "Finance",
  fun: "Fun",
  ambient: "Ambient",
};

export default function WidgetCard({
  widgetId,
  name,
  summary,
  category,
  accent,
  tags,
  installedCount,
  previewSize = "medium",
  onClick,
}: WidgetCardProps) {
  const [display, setDisplay] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const def = getWidgetById(widgetId);
    if (!def) {
      setLoading(false);
      return;
    }
    def
      .fetchData((def.defaultConfig ?? {}) as never, { now: new Date() })
      .then((data) => {
        if (cancelled) return;
        const d = def.toDisplay ? def.toDisplay(data) : data;
        setDisplay(d);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [widgetId]);

  const Renderer = getRenderer(widgetId);
  const visibleTags = tags?.slice(0, 3) ?? [];
  const extraTags = (tags?.length ?? 0) - visibleTags.length;

  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl bg-white/[0.06] border border-white/10 p-4 flex flex-col gap-3 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 w-full"
    >
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -top-10 -left-6 h-24 w-32 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

      {/* top row */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
          />
          <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold truncate">
            {CATEGORY_LABELS[category]}
          </span>
        </div>
        {installedCount > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            Installed ×{installedCount}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-sm font-semibold text-white tracking-tight">{name}</h3>
      </div>

      {/* preview */}
      <div className="relative z-10 h-32 rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden pointer-events-none flex items-center justify-center p-3">
        {loading ? (
          <div className="w-full h-full rounded-lg bg-white/5 animate-pulse" />
        ) : (
          <Renderer data={display} size={previewSize} />
        )}
      </div>

      {/* bottom */}
      <div className="relative z-10 flex flex-col gap-2">
        {summary && (
          <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{summary}</p>
        )}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.08] border border-white/[0.08] px-2 py-0.5 text-[10px] text-white/60"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-full bg-white/[0.08] border border-white/[0.08] px-2 py-0.5 text-[10px] text-white/40">
                +{extraTags}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
