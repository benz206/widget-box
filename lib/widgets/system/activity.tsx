"use client";

import {
  ProgressRing,
  TapButton,
  useNow,
  WidgetHeader,
} from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const RINGS = [
  { key: "move", label: "Move", unit: "kcal", color: "#ff375f", step: 50, goalKey: "moveGoal", goal: 600 },
  { key: "exercise", label: "Exercise", unit: "min", color: "#a3e635", step: 5, goalKey: "exerciseGoal", goal: 30 },
  { key: "stand", label: "Stand", unit: "hr", color: "#30d158", step: 1, goalKey: "standGoal", goal: 12 },
] as const;

type Progress = { day: string; move: number; exercise: number; stand: number };

const today = (now: Date) => now.toISOString().slice(0, 10);

function ActivityView({ instanceId, size, config }: WidgetViewProps) {
  const now = useNow(60_000);
  const [saved, setSaved] = useWidgetState<Progress>(instanceId, "progress", {
    day: "",
    move: 0,
    exercise: 0,
    stand: 0,
  });

  // Yesterday's totals are not today's — the rings start empty each day.
  const stale = Boolean(now) && saved.day !== today(now!);
  const progress: Progress = stale
    ? { day: now ? today(now) : "", move: 0, exercise: 0, stand: 0 }
    : saved;

  const add = (key: (typeof RINGS)[number]["key"], step: number) => {
    setSaved({ ...progress, day: now ? today(now) : progress.day, [key]: progress[key] + step });
  };

  const goalOf = (ring: (typeof RINGS)[number]) => {
    const raw = Number(config[ring.goalKey]);
    return Number.isFinite(raw) && raw > 0 ? raw : ring.goal;
  };

  const dial = size === "large" ? 132 : size === "medium" ? 96 : 76;
  const radii = size === "large" ? [42, 29, 16] : [42, 28, 14];

  const Rings = () => (
    <svg width={dial} height={dial} viewBox="-50 -50 100 100" className="shrink-0">
      {RINGS.map((ring, i) => (
        <ProgressRing
          key={ring.key}
          progress={progress[ring.key] / goalOf(ring)}
          color={ring.color}
          radius={radii[i]}
          stroke={size === "large" ? 11 : 10}
        />
      ))}
    </svg>
  );

  const Buttons = () => (
    <div className="flex gap-1.5">
      {RINGS.map((ring) => (
        <TapButton
          key={ring.key}
          onClick={() => add(ring.key, ring.step)}
          label={`Add ${ring.step} ${ring.unit} to ${ring.label}`}
          icon="plus"
          filled
          accent={ring.color}
        />
      ))}
    </div>
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between">
        <Rings />
        <Buttons />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <WidgetHeader icon="rings" label="Activity" accent={RINGS[0].color} />
      <div className="flex items-center gap-4">
        <Rings />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {RINGS.map((ring) => (
            <div key={ring.key}>
              <div className="text-[10px] font-semibold" style={{ color: ring.color }}>
                {ring.label.toUpperCase()}
              </div>
              <div className="tabular text-[15px] font-medium leading-tight">
                {progress[ring.key]}
                <span className="text-[11px] text-tertiary">
                  /{goalOf(ring)} {ring.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Buttons />
    </div>
  );
}

export const activityWidget: WidgetDefinition = {
  meta: {
    id: "system.fitness",
    name: "Activity",
    tagline: "Close your rings, one tap at a time.",
    description:
      "Three goal rings you log yourself. Totals reset at the start of each day.",
    category: "lifestyle",
    icon: "rings",
    accent: "#ff375f",
    tags: ["health", "habits", "goals"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: { moveGoal: 600, exerciseGoal: 30, standGoal: 12 },
  configFields: [
    { kind: "number", key: "moveGoal", label: "Move goal (kcal)", min: 1 },
    { kind: "number", key: "exerciseGoal", label: "Exercise goal (min)", min: 1 },
    { kind: "number", key: "standGoal", label: "Stand goal (hours)", min: 1, max: 24 },
  ],
  View: ActivityView,
};
