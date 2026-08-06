"use client";

import { TapButton, useNow, WidgetHeader } from "@/app/components/widgets/kit";
import { useWidgetState } from "../state";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#ff375f";

/** Points per hour of real time. */
const DECAY = { fed: -9, joy: -11, energy: 10 };

type Pet = { fed: number; joy: number; energy: number; updatedAt: number };

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Stats are stored as of `updatedAt` and aged forward on read. */
function age(pet: Pet, nowMs: number): Pet {
  const hours = Math.max(0, (nowMs - pet.updatedAt) / 3_600_000);
  return {
    fed: clamp(pet.fed + DECAY.fed * hours),
    joy: clamp(pet.joy + DECAY.joy * hours),
    energy: clamp(pet.energy + DECAY.energy * hours),
    updatedAt: nowMs,
  };
}

function moodOf(pet: Pet) {
  if (pet.fed < 30) return { face: "(•́﹏•̀)", label: "Hungry" };
  if (pet.energy < 25) return { face: "(－_－) zZ", label: "Sleepy" };
  if (pet.joy < 30) return { face: "(╥﹏╥)", label: "Bored" };
  if (pet.joy > 80 && pet.fed > 60) return { face: "(≧▽≦)", label: "Delighted" };
  return { face: "(◕‿◕)", label: "Content" };
}

const STATS = [
  { key: "fed", label: "Fed", color: "#ff9f0a" },
  { key: "joy", label: "Joy", color: "#ff375f" },
  { key: "energy", label: "Energy", color: "#0a84ff" },
] as const;

function PetView({ instanceId, size, config }: WidgetViewProps) {
  const now = useNow(30_000);
  const [stored, setStored] = useWidgetState<Pet>(instanceId, "pet", {
    fed: 80,
    joy: 80,
    energy: 90,
    updatedAt: 0,
  });

  const name = String(config.name || "Bit");
  // updatedAt 0 means "never saved" — treat the defaults as current.
  const pet = now && stored.updatedAt > 0 ? age(stored, now.getTime()) : stored;
  const mood = moodOf(pet);

  const feed = () => setStored({ ...pet, fed: clamp(pet.fed + 32), updatedAt: Date.now() });
  const play = () =>
    setStored({
      ...pet,
      joy: clamp(pet.joy + 30),
      energy: clamp(pet.energy - 12),
      updatedAt: Date.now(),
    });

  const Bars = () => (
    <div className="flex w-full gap-2">
      {STATS.map((stat) => (
        <div key={stat.key} className="flex-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-fill">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pet[stat.key]}%`,
                background: stat.color,
                transition: "width 400ms var(--ease-out-ios)",
              }}
            />
          </div>
          <div className="mt-1 text-[9px] font-semibold text-tertiary">
            {stat.label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="pet" label={name} accent={ACCENT} />
        <div className="text-center">
          <div className="font-mono text-[17px]">{mood.face}</div>
          <div className="mt-1 text-[11px] font-medium text-secondary">{mood.label}</div>
        </div>
        <Bars />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between">
      <WidgetHeader icon="pet" label={name} accent={ACCENT} />
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[22px] leading-tight">{mood.face}</div>
          <div className="mt-1 text-[13px] font-medium text-secondary">{mood.label}</div>
        </div>
        <div className="flex gap-1.5">
          <TapButton onClick={feed} label="Feed" icon="plus" filled accent="#ff9f0a" />
          <TapButton onClick={play} label="Play" icon="sparkles" filled accent={ACCENT} />
        </div>
      </div>
      <Bars />
    </div>
  );
}

export const petWidget: WidgetDefinition = {
  meta: {
    id: "system.pixelpet",
    name: "Pocket Pet",
    tagline: "A small companion that misses you.",
    description:
      "Feed it and play with it. Its stats drift with real elapsed time, so it notices when you are away.",
    category: "fun",
    icon: "pet",
    accent: ACCENT,
    tags: ["pet", "fun"],
    sizes: ["small", "medium"],
    defaultSize: "medium",
  },
  defaultConfig: { name: "Bit" },
  configFields: [{ kind: "text", key: "name", label: "Name", placeholder: "Bit" }],
  View: PetView,
};
