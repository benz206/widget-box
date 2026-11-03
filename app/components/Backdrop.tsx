import { useEffect, useState } from "react";
import Icon from "./ui/Icon";
import { buttonClass } from "./ui/Button";
import {
  BACKDROP_TOPICS,
  fetchPhotos,
  photoSrc,
  trackDownload,
  UNSPLASH_ENABLED,
  UNSPLASH_HOME,
  type BackdropPhoto,
} from "@/lib/api/unsplash";

const SETTINGS_KEY = "widget-box:backdrop-settings";
const DECK_KEY = "widget-box:backdrop-deck";
const CHANGED_EVENT = "widget-box:backdrop-changed";
const NEXT_EVENT = "widget-box:backdrop-next";
const REFILL_BELOW = 5;
const PAGE_OPENED_AT = Date.now();

const FREQUENCY_MS = { tab: 0, hour: 3_600_000, day: 86_400_000 };
type Frequency = keyof typeof FREQUENCY_MS;

export const BACKDROP_FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "tab", label: "Every new tab" },
  { value: "hour", label: "Every hour" },
  { value: "day", label: "Every day" },
];

export type BackdropSettings = { topic: string; frequency: Frequency };
const DEFAULT_SETTINGS: BackdropSettings = { topic: BACKDROP_TOPICS[0].value, frequency: "tab" };

function readSettings(): BackdropSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      topic: BACKDROP_TOPICS.some((t) => t.value === saved.topic) ? saved.topic : DEFAULT_SETTINGS.topic,
      frequency: saved.frequency in FREQUENCY_MS ? saved.frequency : DEFAULT_SETTINGS.frequency,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useBackdropSettings() {
  const [settings, setSettings] = useState(readSettings);
  useEffect(() => {
    const sync = () => setSettings(readSettings());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (patch: Partial<BackdropSettings>) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...readSettings(), ...patch }));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(CHANGED_EVENT));
  };
  return [settings, update] as const;
}

export function showNextPhoto() {
  window.dispatchEvent(new Event(NEXT_EVENT));
}

type Deck = { topic: string; current: BackdropPhoto | null; shownAt: number; queue: BackdropPhoto[] };

function readDeck(topic: string): Deck {
  try {
    const deck = JSON.parse(localStorage.getItem(DECK_KEY) ?? "null") as Deck | null;
    if (deck?.topic === topic && Array.isArray(deck.queue)) return deck;
  } catch {
    localStorage.removeItem(DECK_KEY);
  }
  return { topic, current: null, shownAt: 0, queue: [] };
}

function writeDeck(deck: Deck) {
  try {
    localStorage.setItem(DECK_KEY, JSON.stringify(deck));
  } catch {
    return;
  }
}

let refilling: Promise<Deck> | null = null;

function refill(topic: string): Promise<Deck> {
  refilling ??= fetchPhotos(topic)
    .then((photos) => {
      const deck = readDeck(topic);
      const seen = new Set([deck.current?.id, ...deck.queue.map((p) => p.id)]);
      const next = { ...deck, queue: [...deck.queue, ...photos.filter((p) => !seen.has(p.id))] };
      writeDeck(next);
      return next;
    })
    .finally(() => {
      refilling = null;
    });
  return refilling;
}

function advance(deck: Deck): Deck | null {
  const [next, ...queue] = deck.queue;
  if (!next) return null;
  trackDownload(next);
  const advanced = { ...deck, current: next, queue, shownAt: Date.now() };
  writeDeck(advanced);
  return advanced;
}

function isDue(deck: Deck, frequency: Frequency): boolean {
  if (!deck.current) return true;
  return deck.shownAt < PAGE_OPENED_AT && PAGE_OPENED_AT - deck.shownAt >= FREQUENCY_MS[frequency];
}

function preload(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const finish = (loaded: boolean) => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
      resolve(loaded);
    };
    const timeout = setTimeout(() => finish(false), 15_000);
    img.onload = () => { img.decode().then(() => finish(true), () => finish(false)); };
    img.onerror = () => finish(false);
    img.src = url;
  });
}

type Layer = { photo: BackdropPhoto; fadeMs: number };

export default function Backdrop() {
  const [settings] = useBackdropSettings();
  const [layers, setLayers] = useState<Layer[]>([]);
  const current = layers.at(-1)?.photo;

  useEffect(() => {
    if (!UNSPLASH_ENABLED) return;
    let cancelled = false;

    const show = async (photo: BackdropPhoto) => {
      if (!(await preload(photoSrc(photo))) || cancelled) return;
      setLayers((prev) =>
        prev.at(-1)?.photo.id === photo.id
          ? prev
          : [...prev.slice(-1), { photo, fadeMs: prev.length ? 1200 : 400 }]
      );
    };

    const step = async (force: boolean) => {
      let deck = readDeck(settings.topic);
      if (force || isDue(deck, settings.frequency)) {
        if (!deck.queue.length) deck = await refill(settings.topic).catch(() => deck);
        deck = advance(deck) ?? deck;
      }
      if (cancelled) return;
      if (deck.current) await show(deck.current);
      if (deck.queue.length < REFILL_BELOW) deck = await refill(settings.topic).catch(() => deck);
      if (deck.queue[0]) void preload(photoSrc(deck.queue[0]));
    };

    void step(false);
    const onNext = () => void step(true);
    window.addEventListener(NEXT_EVENT, onNext);
    return () => {
      cancelled = true;
      window.removeEventListener(NEXT_EVENT, onNext);
    };
  }, [settings.topic, settings.frequency]);

  useEffect(() => {
    if (current) document.documentElement.dataset.backdrop = "photo";
  }, [current]);

  if (!current) return null;

  return (
    <>
      <div aria-hidden className="backdrop" style={{ backgroundColor: current.color }}>
        {layers.map(({ photo, fadeMs }) => (
          <div
            key={photo.id}
            className="backdrop-layer"
            style={{ backgroundImage: `url("${photoSrc(photo)}")`, animationDuration: `${fadeMs}ms, 90s` }}
          />
        ))}
        <div className="backdrop-scrim" />
      </div>
      <div className="backdrop-credit" title={current.alt}>
        <span className="truncate">
          Photo by{" "}
          <a href={current.authorUrl} target="_blank" rel="noopener noreferrer" className="focus-ring">
            {current.author}
          </a>{" "}
          on{" "}
          <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer" className="focus-ring">
            Unsplash
          </a>
          {current.location && <span className="backdrop-location"> · {current.location}</span>}
        </span>
        <button
          type="button"
          title="Show another photo"
          aria-label="Show another photo"
          onClick={showNextPhoto}
          className={buttonClass({ variant: "ghost", size: "sm", iconOnly: true })}
        >
          <Icon name="reset" size={13} />
        </button>
      </div>
    </>
  );
}
