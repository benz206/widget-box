"use client";
import { registerSystemWidgets } from "@/lib/widgets/system";
registerSystemWidgets();

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { WidgetCategory } from "@/lib/widgets/types";
import { listByCategory } from "@/lib/widgets/registry";
import { getAccent } from "@/lib/widgets/registry";
import { useDashboard } from "@/lib/storage/dashboard";
import WidgetCard from "@/app/components/marketplace/WidgetCard";
import WidgetDetail from "@/app/components/marketplace/WidgetDetail";

const CATEGORIES: WidgetCategory[] = [
  "productivity",
  "information",
  "lifestyle",
  "finance",
  "fun",
  "ambient",
];

const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  productivity: "Productivity",
  information: "Information",
  lifestyle: "Lifestyle",
  finance: "Finance",
  fun: "Fun",
  ambient: "Ambient",
};

export default function MarketplacePage() {
  const [category, setCategory] = useState<WidgetCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const { state } = useDashboard();

  const byCategory = useMemo(() => listByCategory(), []);

  const allWidgets = useMemo(() => {
    const flat =
      category === "all"
        ? Object.values(byCategory).flat()
        : byCategory[category] ?? [];

    if (!query.trim()) return flat;
    const q = query.toLowerCase();
    return flat.filter(
      (def) =>
        def.meta.name.toLowerCase().includes(q) ||
        def.meta.summary?.toLowerCase().includes(q) ||
        def.meta.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [byCategory, category, query]);

  const installedCounts = useMemo<Record<string, number>>(() => {
    if (!state) return {};
    const counts: Record<string, number> = {};
    for (const inst of state.instances) {
      counts[inst.widgetId] = (counts[inst.widgetId] ?? 0) + 1;
    }
    return counts;
  }, [state]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-white">
              widget-box
            </h1>
          </div>
          <nav>
            <Link
              href="/"
              className="text-xs text-white/50 hover:text-white/90 transition-colors"
            >
              ← Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <div className="mb-8 text-center animate-in">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Widget Marketplace
          </h2>
          <p className="text-white/50 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Add new widgets to your dashboard. Customize each one to your
            liking.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border ${
                category === "all"
                  ? "bg-white/15 border-white/25 text-white"
                  : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white/80 hover:bg-white/[0.09]"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors border ${
                  category === cat
                    ? "bg-white/15 border-white/25 text-white"
                    : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white/80 hover:bg-white/[0.09]"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search widgets…"
            className="rounded-full px-4 py-1.5 text-xs bg-white/[0.06] border border-white/10 text-white/80 placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/[0.09] transition-colors sm:ml-auto sm:w-52"
          />
        </div>

        {/* Grid */}
        {allWidgets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
            {allWidgets.map((def) => (
              <WidgetCard
                key={def.meta.id}
                widgetId={def.meta.id}
                name={def.meta.name}
                summary={def.meta.summary}
                category={def.meta.category ?? "information"}
                accent={getAccent(def.meta.id)}
                tags={def.meta.tags}
                installedCount={installedCounts[def.meta.id] ?? 0}
                onClick={() => setSelectedWidgetId(def.meta.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in">
            <div className="h-14 w-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
              <span className="text-white/40 text-lg">?</span>
            </div>
            <p className="text-white/50 text-sm">No widgets match your search.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="mt-3 text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selectedWidgetId && (
        <WidgetDetail
          widgetId={selectedWidgetId}
          onClose={() => setSelectedWidgetId(null)}
        />
      )}
    </div>
  );
}
