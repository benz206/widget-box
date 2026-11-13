import { useState } from "react";
import Icon from "@/app/components/ui/Icon";
import { fetchOnThisDay, type HistoryEvent } from "@/lib/api/onthisday";
import {
  useNow,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#a2845e";

function OnThisDayView({ size }: WidgetViewProps) {
  const now = useNow(60_000);
  const today = now ?? new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const [offset, setOffset] = useState(() => Math.floor(Math.random() * 1000));
  const { data, error, loading } = useRemote<HistoryEvent[]>(
    `onthisday:${month}-${day}`,
    (signal) => fetchOnThisDay(month, day, signal),
  );

  if (!data) {
    if (loading) return <WidgetSkeleton />;
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="book" label="On This Day" accent={ACCENT} />
        <WidgetMessage>{error ?? "Nothing to show."}</WidgetMessage>
      </div>
    );
  }

  const event = data[offset % data.length];
  const showThumb = size === "large" && event.thumb;
  const clamp = size === "small" ? "line-clamp-3" : showThumb ? "line-clamp-4" : size === "large" ? "line-clamp-8" : "line-clamp-3";

  return (
    <div className="flex h-full w-full flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <WidgetHeader icon="book" label="On This Day" accent={ACCENT} />
        <button
          type="button"
          aria-label="Another event"
          title="Another event"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setOffset((o) => o + 1);
          }}
          className="press focus-ring -mr-1 shrink-0 rounded-full p-1 text-tertiary hover:text-label"
        >
          <Icon name="chevronRight" size={14} strokeWidth={2} />
        </button>
      </div>
      {showThumb && (
        <img
          src={event.thumb!}
          alt=""
          className="min-h-0 w-full flex-1 rounded-lg object-cover"
          style={{ background: "var(--fill)" }}
        />
      )}
      <div className="min-h-0 shrink-0">
        <div
          className="tabular font-semibold leading-tight"
          style={{ color: ACCENT, fontSize: size === "small" ? 18 : 22 }}
        >
          {event.year}
        </div>
        <a
          href={event.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`focus-ring mt-0.5 ${clamp} leading-snug hover:underline`}
          style={{ fontSize: size === "small" ? 11 : 13 }}
        >
          {event.text}
        </a>
      </div>
    </div>
  );
}

export const onThisDayWidget: WidgetDefinition = {
  meta: {
    id: "system.onthisday",
    name: "On This Day",
    tagline: "Something that happened on today's date.",
    description:
      "A different moment from history each time you open a tab, from Wikipedia's selected anniversaries.",
    category: "information",
    icon: "book",
    accent: ACCENT,
    tags: ["history", "wikipedia", "trivia"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  View: OnThisDayView,
};
