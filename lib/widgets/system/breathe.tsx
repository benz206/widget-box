import { useState } from "react";
import { TapButton, useNow, WidgetHeader } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#63e6e2";
const SMALL = 0.45;

type Step = { label: string; seconds: number; scale: number };

const IN = (seconds: number): Step => ({ label: "Inhale", seconds, scale: 1 });
const HOLD_FULL = (seconds: number): Step => ({ label: "Hold", seconds, scale: 1 });
const OUT = (seconds: number): Step => ({ label: "Exhale", seconds, scale: SMALL });
const HOLD_EMPTY = (seconds: number): Step => ({ label: "Hold", seconds, scale: SMALL });

const PATTERNS: Record<string, { name: string; steps: Step[] }> = {
  box: { name: "Box · 4-4-4-4", steps: [IN(4), HOLD_FULL(4), OUT(4), HOLD_EMPTY(4)] },
  relax: { name: "Relax · 4-7-8", steps: [IN(4), HOLD_FULL(7), OUT(8)] },
  even: { name: "Even · 5-5", steps: [IN(5), OUT(5)] },
};

function locate(steps: Step[], elapsedMs: number) {
  const cycle = steps.reduce((sum, s) => sum + s.seconds, 0) * 1000;
  let t = elapsedMs % cycle;
  for (const step of steps) {
    const length = step.seconds * 1000;
    if (t < length) {
      return { step, left: Math.ceil((length - t) / 1000), breaths: Math.floor(elapsedMs / cycle) };
    }
    t -= length;
  }
  return { step: steps[0], left: steps[0].seconds, breaths: 0 };
}

function BreatheView({ size, config }: WidgetViewProps) {
  const pattern = PATTERNS[String(config.pattern)] ?? PATTERNS.box;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const now = useNow(250);

  const at = startedAt !== null && now ? locate(pattern.steps, Math.max(0, now.getTime() - startedAt)) : null;
  const scale = at?.step.scale ?? SMALL;
  const seconds = at ? at.step.seconds : 0.6;

  const orb = (px: number) => (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: px, height: px, background: `color-mix(in srgb, ${ACCENT} 14%, transparent)` }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: ACCENT,
          opacity: 0.85,
          transform: `scale(${scale})`,
          transition: `transform ${seconds}s ease-in-out`,
        }}
      />
    </div>
  );

  const label = at ? `${at.step.label} · ${at.left}` : "Ready";
  const detail = at
    ? `${at.breaths} breath${at.breaths === 1 ? "" : "s"}`
    : pattern.name;
  const button = (
    <TapButton
      onClick={() => setStartedAt((s) => (s === null ? Date.now() : null))}
      label={at ? "Stop" : "Start"}
      icon={at ? "pause" : "play"}
      filled
      accent={ACCENT}
    />
  );

  if (size === "medium") {
    return (
      <div className="flex h-full w-full items-center gap-5">
        {orb(96)}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <div className="truncate text-[17px] font-semibold">{label}</div>
            <div className="truncate text-[12px] text-secondary">{detail}</div>
          </div>
          {button}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-1.5">
      <WidgetHeader icon="wind" label="Breathe" accent={ACCENT} />
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        {orb(size === "large" ? 170 : 58)}
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight">{label}</div>
          {size === "large" && <div className="truncate text-[11px] text-secondary">{detail}</div>}
        </div>
        {button}
      </div>
    </div>
  );
}

export const breatheWidget: WidgetDefinition = {
  meta: {
    id: "system.breathe",
    name: "Breathe",
    tagline: "A minute of slow breathing.",
    description:
      "A circle that grows and shrinks to pace your breath, with box, 4-7-8, and even rhythms.",
    category: "lifestyle",
    icon: "wind",
    accent: ACCENT,
    tags: ["breathing", "calm", "mindfulness"],
    sizes: ["small", "medium", "large"],
    defaultSize: "small",
  },
  defaultConfig: { pattern: "box" },
  configFields: [
    {
      kind: "select",
      key: "pattern",
      label: "Rhythm",
      options: Object.entries(PATTERNS).map(([value, p]) => ({ value, label: p.name })),
    },
  ],
  View: BreatheView,
};
