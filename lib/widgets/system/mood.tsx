"use client";

import { useNow, WidgetHeader } from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#bf5af2";

const MOODS = [
  { label: "Great", glyph: "◎", from: "#ff9f0a", to: "#ff375f" },
  { label: "Good", glyph: "◍", from: "#30d158", to: "#0a84ff" },
  { label: "Okay", glyph: "◐", from: "#5e5ce6", to: "#0a84ff" },
  { label: "Low", glyph: "◔", from: "#48484a", to: "#8e8e93" },
  { label: "Calm", glyph: "○", from: "#64d2ff", to: "#5e5ce6" },
  { label: "Wired", glyph: "◉", from: "#bf5af2", to: "#ff375f" },
] as const;

type Entry = { day: string; index: number | null };

const today = (now: Date) => now.toISOString().slice(0, 10);

function MoodView({ instanceId, size }: WidgetViewProps) {
  const now = useNow(60_000);
  const [saved, setSaved] = useWidgetState<Entry>(instanceId, "mood", {
    day: "",
    index: null,
  });

  const current = now && saved.day === today(now) ? saved.index : null;
  const mood = current === null ? null : MOODS[current];
  const onColor = Boolean(mood);

  const choose = (index: number) => setSaved({ day: now ? today(now) : "", index });

  const Bleed = () =>
    mood ? (
      <div
        className="tile-bleed"
        style={{ background: `linear-gradient(140deg, ${mood.from}, ${mood.to})` }}
      />
    ) : null;

  const header = (
    <WidgetHeader
      icon="sparkles"
      label="Mood"
      accent={onColor ? "rgba(255,255,255,0.9)" : ACCENT}
    />
  );

  if (size === "small") {
    return (
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => choose(((current ?? -1) + 1) % MOODS.length)}
        className="tile-content focus-ring text-left"
        style={onColor ? { color: "#fff" } : undefined}
      >
        <Bleed />
        <div className="relative flex h-full w-full flex-col justify-between">
          {header}
          <div>
            <div className="text-[2.2rem] leading-none">{mood?.glyph ?? "＋"}</div>
            <div
              className="mt-1.5 text-[15px] font-semibold"
              style={onColor ? undefined : { color: "var(--label-secondary)" }}
            >
              {mood?.label ?? "Tap to log"}
            </div>
          </div>
          <div
            className="text-[11px]"
            style={{ color: onColor ? "rgba(255,255,255,0.75)" : "var(--label-tertiary)" }}
          >
            {mood ? "Tap to change" : "How are you today?"}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="tile-content" style={onColor ? { color: "#fff" } : undefined}>
      <Bleed />
      <div className="relative flex h-full w-full flex-col justify-between">
        {header}
        <div className="flex items-center gap-3">
          <span className="text-[2.4rem] leading-none">{mood?.glyph ?? "○"}</span>
          <div className="min-w-0">
            <div className="text-[19px] font-semibold leading-tight">
              {mood?.label ?? "Not logged"}
            </div>
            <div
              className="text-[12px]"
              style={{
                color: onColor ? "rgba(255,255,255,0.75)" : "var(--label-secondary)",
              }}
            >
              {mood ? "Logged today" : "How are you feeling?"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m, i) => (
            <button
              key={m.label}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => choose(i)}
              className="press focus-ring rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={
                current === i
                  ? { background: "rgba(255,255,255,0.3)", color: "#fff" }
                  : onColor
                    ? { background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)" }
                    : { background: "var(--fill)", color: "var(--label-secondary)" }
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const moodWidget: WidgetDefinition = {
  meta: {
    id: "system.mood",
    name: "Mood",
    tagline: "Log how today felt in one tap.",
    description:
      "A daily check-in. The tile takes on the colour of whatever you pick.",
    category: "ambient",
    icon: "sparkles",
    accent: ACCENT,
    tags: ["mood", "journal", "check-in"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  View: MoodView,
};
