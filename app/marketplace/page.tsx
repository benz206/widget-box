"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AppHeader from "@/app/components/AppHeader";
import Icon from "@/app/components/ui/Icon";
import WidgetCard from "@/app/components/marketplace/WidgetCard";
import WidgetDetail from "@/app/components/marketplace/WidgetDetail";
import { useDashboard } from "@/lib/storage/dashboard";
import { CATEGORY_LABELS, listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import type { WidgetCategory } from "@/lib/widgets/types";

registerSystemWidgets();

const CATEGORY_ORDER: WidgetCategory[] = [
  "productivity",
  "information",
  "finance",
  "lifestyle",
  "ambient",
  "fun",
];

export default function MarketplacePage() {
  const { state, actions } = useDashboard(SYSTEM_WIDGET_IDS);
  const [category, setCategory] = useState<WidgetCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listWidgets().filter((def) => {
      if (category !== "all" && def.meta.category !== category) return false;
      if (!q) return true;
      return (
        def.meta.name.toLowerCase().includes(q) ||
        def.meta.tagline.toLowerCase().includes(q) ||
        def.meta.tags.some((tag) => tag.includes(q))
      );
    });
  }, [category, query]);

  const installed = useMemo(() => {
    const counts = new Map<string, number>();
    state?.instances.forEach((i) =>
      counts.set(i.widgetId, (counts.get(i.widgetId) ?? 0) + 1)
    );
    return counts;
  }, [state]);

  return (
    <div className="min-h-screen">
      <AppHeader subtitle="Widgets">
        <Link
          href="/"
          className="press focus-ring flex h-8 items-center gap-1.5 rounded-full bg-fill px-3 text-[13px] font-medium"
        >
          <Icon name="chevronLeft" size={14} strokeWidth={2.2} />
          Dashboard
        </Link>
      </AppHeader>

      <main className="mx-auto max-w-[1160px] px-5 py-8">
        <div className="mb-7">
          <h1 className="text-[30px] font-semibold tracking-tight">Widgets</h1>
          <p className="mt-1.5 text-[15px] text-secondary">
            {listWidgets().length} widgets, all of them live. Pick a size, adjust
            the settings, and drop it on your dashboard.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">
              <Icon name="search" size={15} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="focus-ring h-9 w-full rounded-full bg-fill pl-9 pr-4 text-[14px] outline-none placeholder:text-tertiary"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {(["all", ...CATEGORY_ORDER] as const).map((option) => {
              const active = category === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className="press focus-ring rounded-full px-3 py-1.5 text-[12.5px] font-medium"
                  style={
                    active
                      ? { background: "var(--accent)", color: "#fff" }
                      : { background: "var(--fill)", color: "var(--label-secondary)" }
                  }
                >
                  {option === "all" ? "All" : CATEGORY_LABELS[option]}
                </button>
              );
            })}
          </div>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((definition) => (
              <WidgetCard
                key={definition.meta.id}
                definition={definition}
                installedCount={installed.get(definition.meta.id) ?? 0}
                onSelect={() => setSelected(definition.meta.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-fill text-tertiary">
              <Icon name="search" size={22} />
            </span>
            <p className="text-[14px] text-secondary">Nothing matches that.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="press focus-ring mt-3 text-[13px] font-medium text-accent"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {selected && (
        <WidgetDetail
          widgetId={selected}
          state={state}
          actions={actions}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
