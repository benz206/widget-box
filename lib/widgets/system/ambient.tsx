import { useEffect, useRef, useState } from "react";
import { TapButton, WidgetHeader } from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#5e5ce6";

type Recipe = {
  label: string;
  filters: [BiquadFilterType, number][];
  gain: number;
  swellHz?: number;
};

const SOUNDS = {
  rain: { label: "Rain", filters: [["highpass", 800], ["lowpass", 7000]], gain: 0.5 },
  waves: { label: "Waves", filters: [["lowpass", 600]], gain: 1.6, swellHz: 0.08 },
  fan: { label: "Fan", filters: [["lowpass", 1200]], gain: 1.2 },
  brown: { label: "Brown noise", filters: [["lowpass", 250]], gain: 2.5 },
} satisfies Record<string, Recipe>;

type SoundId = keyof typeof SOUNDS;
const IDS = Object.keys(SOUNDS) as SoundId[];

type Engine = { ctx: AudioContext; master: GainNode };

function start(sound: SoundId, volume: number): Engine {
  const recipe: Recipe = SOUNDS[sound];
  const ctx = new AudioContext();

  const noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;

  let tail: AudioNode = source;
  for (const [type, frequency] of recipe.filters) {
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    tail.connect(filter);
    tail = filter;
  }

  const level = ctx.createGain();
  level.gain.value = recipe.gain;
  if (recipe.swellHz) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = recipe.swellHz;
    const depth = ctx.createGain();
    depth.gain.value = recipe.gain * 0.7;
    lfo.connect(depth).connect(level.gain);
    lfo.start();
  }

  const master = ctx.createGain();
  master.gain.setValueAtTime(0, ctx.currentTime);
  master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.5);
  tail.connect(level).connect(master).connect(ctx.destination);
  source.start();
  return { ctx, master };
}

function stop({ ctx, master }: Engine) {
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
  setTimeout(() => ctx.close(), 800);
}

function AmbientView({ instanceId, size, config }: WidgetViewProps) {
  const [stored, setSound] = useWidgetState<SoundId>(instanceId, "sound", "rain");
  const sound = IDS.includes(stored) ? stored : "rain";
  const [playing, setPlaying] = useState(false);
  const engine = useRef<Engine | null>(null);
  const volumeRef = useRef(0.5);
  const raw = Number(config.volume);
  const volume = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) / 100 : 0.5;

  useEffect(() => {
    volumeRef.current = volume;
    const current = engine.current;
    current?.master.gain.setTargetAtTime(volume, current.ctx.currentTime, 0.1);
  }, [volume]);

  useEffect(() => {
    if (!playing) return;
    const current = start(sound, volumeRef.current);
    engine.current = current;
    return () => {
      engine.current = null;
      stop(current);
    };
  }, [playing, sound]);

  const choose = (id: SoundId) => {
    setSound(id);
    setPlaying(true);
  };

  const play = (
    <TapButton
      onClick={() => setPlaying((p) => !p)}
      label={playing ? "Pause" : "Play"}
      icon={playing ? "pause" : "play"}
      filled
      accent={ACCENT}
    />
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="waves" label="Ambient" accent={ACCENT} />
        <div>
          <div className="truncate text-[15px] font-semibold">{SOUNDS[sound].label}</div>
          <div className="text-[11px] text-secondary">{playing ? "Playing" : "Paused"}</div>
        </div>
        <div className="flex gap-2">
          {play}
          <TapButton
            onClick={() => choose(IDS[(IDS.indexOf(sound) + 1) % IDS.length])}
            label="Next sound"
            icon="chevronRight"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <WidgetHeader icon="waves" label="Ambient" accent={ACCENT} />
      <div className="flex min-h-0 flex-1 items-center gap-3">
        {play}
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
          {IDS.map((id) => (
            <button
              key={id}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                choose(id);
              }}
              className="press focus-ring truncate rounded-full px-2.5 py-1.5 text-[12px] font-medium"
              style={
                id === sound && playing
                  ? { background: ACCENT, color: "#fff" }
                  : {
                      background: "var(--fill)",
                      color: id === sound ? "var(--label)" : "var(--label-secondary)",
                    }
              }
            >
              {SOUNDS[id].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ambientWidget: WidgetDefinition = {
  meta: {
    id: "system.ambient",
    name: "Ambient Sound",
    tagline: "Rain, waves, or a fan, while you work.",
    description:
      "Background sound generated in the browser, with nothing to download. Keeps playing while this tab stays open.",
    category: "ambient",
    icon: "waves",
    accent: ACCENT,
    tags: ["sound", "focus", "noise", "rain"],
    sizes: ["small", "medium"],
    defaultSize: "medium",
  },
  defaultConfig: { volume: 50 },
  configFields: [
    { kind: "range", key: "volume", label: "Volume", min: 0, max: 100, step: 5, unit: "%" },
  ],
  View: AmbientView,
};
