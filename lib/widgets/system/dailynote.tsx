"use client";

import { useNow, WidgetHeader, WidgetSkeleton } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#ff9f0a";

const LINES = [
  "Small steps still move the needle.",
  "Today is a draft, not a deadline.",
  "Progress over polish.",
  "Be where your feet are.",
  "The hard thing is usually the right thing.",
  "Curiosity beats certainty.",
  "Less, but better.",
  "Done is the engine of more.",
  "You can do anything, but not everything.",
  "Start where you are. Use what you have.",
  "Slow is smooth, smooth is fast.",
  "Attention is the rarest form of generosity.",
  "Make it work, then make it good.",
  "The obstacle is the way.",
  "Rest is part of the work.",
];

function DailyNoteView({ size }: WidgetViewProps) {
  const now = useNow(60_000);
  if (!now) return <WidgetSkeleton />;

  // Local midnight boundaries, so the line turns over with the user's day.
  const dayIndex = Math.floor(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86_400_000
  );

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      <WidgetHeader icon="quote" label="Daily Note" accent={ACCENT} />
      <p
        className="font-medium leading-snug"
        style={{ fontSize: size === "small" ? 14 : 18 }}
      >
        {LINES[dayIndex % LINES.length]}
      </p>
      <span className="text-[11px] text-tertiary">
        {now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </span>
    </div>
  );
}

export const dailyNoteWidget: WidgetDefinition = {
  meta: {
    id: "system.affirmation",
    name: "Daily Note",
    tagline: "One line to carry through the day.",
    description: "A short note that changes at midnight, wherever you are.",
    category: "ambient",
    icon: "quote",
    accent: ACCENT,
    tags: ["mindfulness", "quote"],
    sizes: ["small", "medium"],
    defaultSize: "medium",
  },
  View: DailyNoteView,
};
