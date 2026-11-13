import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/app/components/ui/Button";
import FilterPills from "@/app/components/ui/FilterPills";
import Icon from "@/app/components/ui/Icon";
import PageHeader from "@/app/components/ui/PageHeader";
import Segmented from "@/app/components/ui/Segmented";
import useDismiss from "@/app/components/ui/useDismiss";
import WidgetCard from "@/app/components/marketplace/WidgetCard";
import WidgetDetail from "@/app/components/marketplace/WidgetDetail";
import WidgetTable from "@/app/components/marketplace/WidgetTable";
import { useDashboard } from "@/lib/storage/dashboard";
import { CATEGORY_LABELS, listWidgets } from "@/lib/widgets/registry";
import { SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import type { WidgetCategory } from "@/lib/widgets/types";

const CATEGORY_ORDER: WidgetCategory[] = [
  "productivity",
  "information",
  "finance",
  "lifestyle",
  "ambient",
  "fun",
];

export default function Library({ onClose }: { onClose: () => void }) {
  const { state, actions } = useDashboard(SYSTEM_WIDGET_IDS);
  const [category, setCategory] = useState<WidgetCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, dismiss] = useDismiss(() => ref.current?.close());

  const all = listWidgets();
  const categoryOptions = [
    { value: "all" as const, label: "All", count: all.length },
    ...CATEGORY_ORDER.map((c) => ({
      value: c,
      label: CATEGORY_LABELS[c],
      count: all.filter((def) => def.meta.category === c).length,
    })).filter((option) => option.count > 0),
  ];

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

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const installed = useMemo(() => {
    const counts = new Map<string, number>();
    state?.instances.forEach((i) =>
      counts.set(i.widgetId, (counts.get(i.widgetId) ?? 0) + 1)
    );
    return counts;
  }, [state]);

  return (
    <>
      <dialog
        ref={ref}
        closedby="any"
        aria-label="Widget library"
        className="sheet card animate-sheet-in"
        data-closing={closing || undefined}
        onCancel={(e) => {
          e.preventDefault();
          dismiss();
        }}
        onClose={onClose}
      >
        <PageHeader
          title="Widget library"
          description={`${all.length} widgets. Add as many copies as you like; each one keeps its own settings.`}
          actions={
            <Button variant="ghost" iconOnly autoFocus onClick={dismiss} aria-label="Close library">
              <Icon name="xmark" size={16} />
            </Button>
          }
        />

        <div className="toolbar">
          <FilterPills label="Category" options={categoryOptions} value={category} onChange={setCategory} />
          <div className="toolbar-end">
            <div className="search">
              <Icon name="search" size={14} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search widgets"
                aria-label="Search widgets"
                className="input"
              />
            </div>
            <Segmented
              options={[
                { value: "grid", label: "Grid view", icon: "grid" },
                { value: "list", label: "List view", icon: "list" },
              ]}
              value={view}
              onChange={setView}
            />
          </div>
        </div>

        {results.length === 0 ? (
          <div className="card empty-state">
            <span className="icon-tile">
              <Icon name="search" size={16} />
            </span>
            <h2>No widgets match</h2>
            <p>Try a different search or category.</p>
            <Button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : view === "grid" ? (
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
          <WidgetTable definitions={results} installed={installed} onSelect={setSelected} />
        )}
      </dialog>

      {selected && (
        <WidgetDetail
          widgetId={selected}
          state={state}
          actions={actions}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
