import { useEffect, useRef, useState } from "react";
import { TapButton, WidgetHeader, WidgetMessage } from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#bf5af2";

type Mode = "coin" | "dice" | "pick";

const MODES: Record<Mode, { title: string; verb: string }> = {
  coin: { title: "Coin flip", verb: "Tap to flip" },
  dice: { title: "Dice", verb: "Tap to roll" },
  pick: { title: "Pick one", verb: "Tap to pick" },
};

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 28], [72, 28], [28, 50], [72, 50], [28, 72], [72, 72]],
};

function draw(mode: Mode, options: string[]): string {
  if (mode === "coin") return Math.random() < 0.5 ? "Heads" : "Tails";
  if (mode === "dice") return String(1 + Math.floor(Math.random() * 6));
  return options[Math.floor(Math.random() * options.length)];
}

function Face({ mode, value, px }: { mode: Mode; value: string | null; px: number }) {
  if (mode === "dice") {
    return (
      <svg width={px} height={px} viewBox="0 0 100 100" aria-hidden>
        <rect x="4" y="4" width="92" height="92" rx="22" fill={ACCENT} />
        {PIPS[Number(value)] ? (
          PIPS[Number(value)].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#fff" />
          ))
        ) : (
          <text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="600" fill="#fff">
            ?
          </text>
        )}
      </svg>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-semibold text-white"
      style={{ width: px, height: px, background: ACCENT, fontSize: px * 0.42 }}
    >
      {value ? value[0] : "?"}
    </div>
  );
}

function DecideView({ instanceId, size, config }: WidgetViewProps) {
  const mode: Mode = config.mode === "dice" || config.mode === "pick" ? config.mode : "coin";
  const options = (Array.isArray(config.options) ? config.options.map(String) : [])
    .map((o) => o.trim())
    .filter(Boolean);
  const [result, setResult] = useWidgetState<{ mode: Mode; value: string } | null>(
    instanceId,
    "result",
    null
  );
  const [shuffle, setShuffle] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);

  if (mode === "pick" && options.length < 2) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="dice" label={MODES.pick.title} accent={ACCENT} />
        <WidgetMessage>Add at least two choices in settings.</WidgetMessage>
      </div>
    );
  }

  const settled =
    result?.mode === mode && (mode !== "pick" || options.includes(result.value))
      ? result.value
      : null;
  const value = shuffle ?? settled;

  const go = () => {
    if (timer.current) return;
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks += 1;
      if (ticks < 9) {
        setShuffle(draw(mode, options));
        return;
      }
      clearInterval(timer.current);
      timer.current = undefined;
      setShuffle(null);
      setResult({ mode, value: draw(mode, options) });
    }, 70);
  };

  const target = (px: number) => (
    <button
      type="button"
      aria-label={MODES[mode].verb}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        go();
      }}
      className="press focus-ring shrink-0 rounded-[22%]"
    >
      <Face mode={mode} value={value} px={px} />
    </button>
  );

  const text = (
    <span className={value ? "" : "text-tertiary"}>{value ?? MODES[mode].verb}</span>
  );

  if (mode === "pick") {
    return (
      <div className="flex h-full w-full flex-col justify-between gap-2">
        <WidgetHeader icon="dice" label={MODES.pick.title} accent={ACCENT} />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            go();
          }}
          className="press focus-ring min-h-0 flex-1 rounded-lg text-left"
        >
          <div
            className="line-clamp-2 font-semibold leading-tight"
            style={{ fontSize: size === "small" ? 18 : 24, color: value ? ACCENT : undefined }}
          >
            {text}
          </div>
        </button>
        <div className="truncate text-[11px] text-tertiary">
          {size === "small" ? `${options.length} choices` : options.join(" · ")}
        </div>
      </div>
    );
  }

  if (size === "medium") {
    return (
      <div className="flex h-full w-full items-center gap-5">
        {target(84)}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div>
            <div className="text-[12px] font-semibold text-secondary">{MODES[mode].title}</div>
            <div className="truncate text-[22px] font-semibold leading-tight">{text}</div>
          </div>
          <TapButton onClick={go} label="Again" icon="reset" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <WidgetHeader icon="dice" label={MODES[mode].title} accent={ACCENT} />
      <div className="flex min-h-0 flex-1 items-center justify-center">{target(56)}</div>
      <div className="truncate text-center text-[13px] font-semibold">{text}</div>
    </div>
  );
}

export const decideWidget: WidgetDefinition = {
  meta: {
    id: "system.decide",
    name: "Decide",
    tagline: "Let chance settle it.",
    description: "Flip a coin, roll a die, or pick one of your own choices at random.",
    category: "fun",
    icon: "dice",
    accent: ACCENT,
    tags: ["random", "coin", "dice", "decision"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  defaultConfig: { mode: "coin", options: ["Pizza", "Sushi", "Tacos"] },
  configFields: [
    {
      kind: "select",
      key: "mode",
      label: "Mode",
      options: [
        { value: "coin", label: "Coin flip" },
        { value: "dice", label: "Dice" },
        { value: "pick", label: "Pick from a list" },
      ],
    },
    {
      kind: "list",
      key: "options",
      label: "Choices",
      placeholder: "Pizza, Sushi, Tacos",
      help: "Used by Pick from a list, comma separated",
    },
  ],
  View: DecideView,
};
