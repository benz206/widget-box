import { useEffect, useState } from "react";
import { WidgetHeader, WidgetMessage } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#5e5ce6";
const STALE_MS = 7 * 86_400_000;

type TabCounts = {
  tabs: number;
  stale: number;
  audible: number;
  perWindow: number[];
};

const hasTabsApi = () =>
  typeof chrome !== "undefined" && Boolean(chrome.tabs && chrome.windows);

function countTabs(tabs: { windowId: number; lastAccessed?: number; audible?: boolean }[], now: number): TabCounts {
  const byWindow = new Map<number, number>();
  for (const tab of tabs) byWindow.set(tab.windowId, (byWindow.get(tab.windowId) ?? 0) + 1);
  return {
    tabs: tabs.length,
    stale: tabs.filter((t) => t.lastAccessed !== undefined && now - t.lastAccessed > STALE_MS).length,
    audible: tabs.filter((t) => t.audible).length,
    perWindow: [...byWindow.values()].sort((a, b) => b - a),
  };
}

function useTabCounts(): TabCounts | null {
  const [counts, setCounts] = useState<TabCounts | null>(null);

  useEffect(() => {
    if (!hasTabsApi()) return;
    let cancelled = false;
    const refresh = () =>
      chrome.tabs.query({}).then((tabs) => !cancelled && setCounts(countTabs(tabs, Date.now())));

    const events = [
      chrome.tabs.onCreated,
      chrome.tabs.onRemoved,
      chrome.tabs.onAttached,
      chrome.tabs.onUpdated,
    ] as chrome.events.Event<() => void>[];
    refresh();
    events.forEach((e) => e.addListener(refresh));
    return () => {
      cancelled = true;
      events.forEach((e) => e.removeListener(refresh));
    };
  }, []);

  return counts;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function TabsView({ size }: WidgetViewProps) {
  const counts = useTabCounts();
  const header = <WidgetHeader icon="tabs" label="Tabs" accent={ACCENT} />;

  if (!hasTabsApi()) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>Load Widget Box as a Chrome extension to count tabs.</WidgetMessage>
      </div>
    );
  }

  if (!counts) return <div className="flex h-full w-full flex-col">{header}</div>;

  const windows = counts.perWindow.length;
  const total = (
    <div className="tabular font-light leading-none tracking-tight" style={{ fontSize: "2.6rem" }}>
      {counts.tabs}
      <span className="ml-1 text-[0.4em] font-medium text-secondary">
        {counts.tabs === 1 ? "tab" : "tabs"}
      </span>
    </div>
  );
  const notes = [
    counts.stale > 0 && `${counts.stale} untouched for a week`,
    counts.audible > 0 && `${counts.audible} playing audio`,
  ].filter(Boolean);

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        {header}
        {total}
        <div className="truncate text-[11px] font-medium text-secondary">
          {notes[0] || `in ${plural(windows, "window")}`}
        </div>
      </div>
    );
  }

  const busiest = counts.perWindow[0] ?? 1;

  return (
    <div className="flex h-full w-full gap-4">
      <div className="flex min-w-0 flex-col justify-between">
        {header}
        {total}
        <div className="flex flex-col text-[11px] font-medium text-secondary">
          <span>in {plural(windows, "window")}</span>
          {notes.map((note) => (
            <span key={String(note)} className="truncate text-tertiary">
              {note}
            </span>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        {counts.perWindow.slice(0, 4).map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-fill">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(n / busiest) * 100}%`,
                  background: ACCENT,
                  transition: "width 500ms var(--ease-out-ios)",
                }}
              />
            </div>
            <span className="tabular w-6 text-right text-[11px] font-medium text-secondary">{n}</span>
          </div>
        ))}
        {windows > 4 && (
          <span className="text-[10px] text-tertiary">+{plural(windows - 4, "more window")}</span>
        )}
      </div>
    </div>
  );
}

export const tabsWidget: WidgetDefinition = {
  meta: {
    id: "system.tabs",
    name: "Tabs",
    tagline: "How many tabs you really have open.",
    description:
      "A live count of open tabs and windows, plus tabs you haven't looked at in a week and tabs playing audio.",
    category: "productivity",
    icon: "tabs",
    accent: ACCENT,
    tags: ["browser", "tabs", "focus"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  View: TabsView,
};
