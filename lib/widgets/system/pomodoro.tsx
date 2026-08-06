"use client";

import { useCallback, useEffect } from "react";
import {
  formatClock,
  ProgressRing,
  TapButton,
  useNow,
  WidgetHeader,
} from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const FOCUS = "#ff9f0a";
const BREAK = "#30d158";

type Timer = {
  mode: "focus" | "break";
  /** Epoch ms the current phase ends at; null while paused. */
  endsAt: number | null;
  /** Milliseconds left when paused. */
  remainingMs: number;
  /** Untouched since the last reset, so it tracks the configured length. */
  pristine: boolean;
  completed: number;
};

function minutesOf(config: Record<string, unknown>, key: string, fallback: number) {
  const raw = Number(config[key]);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 180) : fallback;
}

function PomodoroView({ instanceId, size, config }: WidgetViewProps) {
  const focusMs = minutesOf(config, "focusMinutes", 25) * 60_000;
  const breakMs = minutesOf(config, "breakMinutes", 5) * 60_000;

  const [timer, setTimer] = useWidgetState<Timer>(instanceId, "timer", {
    mode: "focus",
    endsAt: null,
    remainingMs: focusMs,
    pristine: true,
    completed: 0,
  });

  const now = useNow(500);
  const running = timer.endsAt !== null;
  const totalMs = timer.mode === "focus" ? focusMs : breakMs;
  // A pristine timer follows the configured length, so editing the interval in
  // settings is reflected immediately.
  const remaining = running
    ? Math.max(0, timer.endsAt! - (now?.getTime() ?? Date.now()))
    : timer.pristine
      ? totalMs
      : timer.remainingMs;

  // A finished phase rolls straight into the next one, the way a pomodoro run
  // is meant to flow.
  useEffect(() => {
    if (!running || remaining > 0) return;
    setTimer((prev) => {
      const next = prev.mode === "focus" ? "break" : "focus";
      const length = next === "focus" ? focusMs : breakMs;
      return {
        mode: next,
        endsAt: Date.now() + length,
        remainingMs: length,
        pristine: false,
        completed: prev.completed + (prev.mode === "focus" ? 1 : 0),
      };
    });
  }, [running, remaining, focusMs, breakMs, setTimer]);

  const toggle = useCallback(() => {
    setTimer((prev) => {
      if (prev.endsAt !== null) {
        return {
          ...prev,
          endsAt: null,
          remainingMs: Math.max(0, prev.endsAt - Date.now()),
        };
      }
      const from = prev.pristine
        ? prev.mode === "focus"
          ? focusMs
          : breakMs
        : prev.remainingMs;
      return { ...prev, endsAt: Date.now() + from, remainingMs: from, pristine: false };
    });
  }, [setTimer, focusMs, breakMs]);

  const reset = useCallback(() => {
    setTimer((prev) => ({
      ...prev,
      endsAt: null,
      pristine: true,
      remainingMs: prev.mode === "focus" ? focusMs : breakMs,
    }));
  }, [setTimer, focusMs, breakMs]);

  const color = timer.mode === "focus" ? FOCUS : BREAK;
  const progress = 1 - remaining / totalMs;
  const clock = formatClock(remaining / 1000);

  const Dial = ({ px }: { px: number }) => (
    <div className="relative shrink-0" style={{ width: px, height: px }}>
      <svg width={px} height={px} viewBox="-50 -50 100 100">
        <ProgressRing progress={progress} color={color} radius={44} stroke={7} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="tabular font-light leading-none tracking-tight"
          style={{ fontSize: px * 0.26 }}
        >
          {clock}
        </span>
      </div>
    </div>
  );

  const Controls = () => (
    <div className="flex items-center gap-2">
      <TapButton
        onClick={toggle}
        label={running ? "Pause" : "Start"}
        icon={running ? "pause" : "play"}
        filled
        accent={color}
      />
      <TapButton onClick={reset} label="Reset" icon="reset" />
    </div>
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-between">
        <WidgetHeader
          icon="timer"
          label={timer.mode === "focus" ? "Focus" : "Break"}
          accent={color}
        />
        <Dial px={80} />
        <Controls />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center gap-5">
      <Dial px={size === "large" ? 150 : 96} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <div className="text-[15px] font-semibold" style={{ color }}>
            {timer.mode === "focus" ? "Focus" : "Break"}
          </div>
          <div className="text-[12px] text-secondary">
            {running ? "In progress" : remaining === totalMs ? "Ready" : "Paused"}
          </div>
        </div>
        <Controls />
        {size === "large" && (
          <div className="mt-1">
            <div className="text-[11px] font-medium text-tertiary">
              {timer.completed} session{timer.completed === 1 ? "" : "s"} today
            </div>
            <div className="mt-1.5 flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: i < timer.completed ? FOCUS : "var(--fill-secondary)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const pomodoroWidget: WidgetDefinition = {
  meta: {
    id: "system.pomodoro",
    name: "Focus Timer",
    tagline: "A pomodoro timer that actually runs.",
    description:
      "Start, pause, and reset focus and break intervals. Keeps running across reloads.",
    category: "productivity",
    icon: "timer",
    accent: FOCUS,
    tags: ["focus", "pomodoro", "timer"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: { focusMinutes: 25, breakMinutes: 5 },
  configFields: [
    { kind: "number", key: "focusMinutes", label: "Focus minutes", min: 1, max: 180 },
    { kind: "number", key: "breakMinutes", label: "Break minutes", min: 1, max: 180 },
  ],
  View: PomodoroView,
};
