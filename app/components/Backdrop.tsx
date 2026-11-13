import { useEffect, useRef, useState } from "react";
import Icon from "./ui/Icon";
import { buttonClass } from "./ui/Button";
import {
  BACKDROP_TOPICS,
  CUSTOM_TOPIC,
  FAVORITES_TOPIC,
  fetchPhotos,
  loadImage,
  photoSrc,
  pruneImages,
  trackDownload,
  UNSPLASH_ENABLED,
  UNSPLASH_HOME,
  warmImage,
  type BackdropPhoto,
} from "@/lib/api/unsplash";

const SETTINGS_KEY = "widget-box:backdrop-settings";
const DECK_KEY = "widget-box:backdrop-deck";
const CHANGED_EVENT = "widget-box:backdrop-changed";
const NEXT_EVENT = "widget-box:backdrop-next";
const SHOW_EVENT = "widget-box:backdrop-show";
const REFRESH_EVENT = "widget-box:backdrop-refresh";
const DECK_EVENT = "widget-box:backdrop-deck-changed";
const FAVORITES_KEY = "widget-box:backdrop-favorites";
const FAVORITES_EVENT = "widget-box:backdrop-favorites-changed";
const REFILL_BELOW = 5;
const CACHED_AHEAD = 2;
const PARALLAX_PX = 14;

const FREQUENCY_MS = { quarter: 900_000, hour: 3_600_000, day: 86_400_000 };
type Frequency = keyof typeof FREQUENCY_MS;
type Motion = "still" | "drift" | "parallax";
type Credit = "shown" | "hover";

export const BACKDROP_FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "quarter", label: "Every 15 minutes" },
  { value: "hour", label: "Every hour" },
  { value: "day", label: "Every day" },
];

export const BACKDROP_MOTIONS: { value: Motion; label: string }[] = [
  { value: "parallax", label: "Drift and follow the pointer" },
  { value: "drift", label: "Slow drift" },
  { value: "still", label: "Still" },
];

export const BACKDROP_CREDITS: { value: Credit; label: string }[] = [
  { value: "shown", label: "Always" },
  { value: "hover", label: "Only on hover" },
];

export type BackdropSettings = {
  topic: string;
  query: string;
  frequency: Frequency;
  motion: Motion;
  dim: number;
  blur: number;
  credit: Credit;
  favoritesOnly: boolean;
};

const DEFAULT_SETTINGS: BackdropSettings = {
  topic: BACKDROP_TOPICS[0].value,
  query: "",
  frequency: "quarter",
  motion: "parallax",
  dim: 0,
  blur: 0,
  credit: "shown",
  favoritesOnly: false,
};

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

function readSettings(): BackdropSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      topic: BACKDROP_TOPICS.some((t) => t.value === saved.topic) ? saved.topic : DEFAULT_SETTINGS.topic,
      query: typeof saved.query === "string" ? saved.query : "",
      frequency: saved.frequency in FREQUENCY_MS ? saved.frequency : DEFAULT_SETTINGS.frequency,
      motion: BACKDROP_MOTIONS.some((m) => m.value === saved.motion) ? saved.motion : DEFAULT_SETTINGS.motion,
      dim: clamp(saved.dim, 0, 80, DEFAULT_SETTINGS.dim),
      blur: clamp(saved.blur, 0, 24, DEFAULT_SETTINGS.blur),
      credit: BACKDROP_CREDITS.some((c) => c.value === saved.credit) ? saved.credit : DEFAULT_SETTINGS.credit,
      favoritesOnly: saved.favoritesOnly === true || saved.topic === FAVORITES_TOPIC,
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

export function refreshPhotos() {
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

export function showPhoto(photo: BackdropPhoto) {
  window.dispatchEvent(new CustomEvent(SHOW_EVENT, { detail: photo }));
}

type Deck = { source: string; current: BackdropPhoto | null; shownAt: number; queue: BackdropPhoto[] };

const sourceOf = (settings: BackdropSettings) =>
  settings.favoritesOnly
    ? FAVORITES_TOPIC
    : settings.topic === CUSTOM_TOPIC ? `query:${settings.query.trim().toLowerCase()}` : settings.topic;

function readDeck(source: string): Deck {
  try {
    const deck = JSON.parse(localStorage.getItem(DECK_KEY) ?? "null") as Deck | null;
    if (deck?.source === source && Array.isArray(deck.queue)) return deck;
  } catch {
    localStorage.removeItem(DECK_KEY);
  }
  return { source, current: null, shownAt: 0, queue: [] };
}

function writeDeck(deck: Deck) {
  try {
    localStorage.setItem(DECK_KEY, JSON.stringify(deck));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(DECK_EVENT));
}

export function useDeck(): Deck {
  const [deck, setDeck] = useState(() => readDeck(sourceOf(readSettings())));
  useEffect(() => {
    const sync = () => setDeck(readDeck(sourceOf(readSettings())));
    window.addEventListener(DECK_EVENT, sync);
    window.addEventListener(CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener(DECK_EVENT, sync);
      window.removeEventListener(CHANGED_EVENT, sync);
    };
  }, []);
  return deck;
}

function readFavorites(): BackdropPhoto[] {
  try {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
    return Array.isArray(favorites) ? favorites : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(photo: BackdropPhoto) {
  const favorites = readFavorites();
  const next = favorites.some((p) => p.id === photo.id)
    ? favorites.filter((p) => p.id !== photo.id)
    : [photo, ...favorites];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(FAVORITES_EVENT));
}

export function useFavorites(): BackdropPhoto[] {
  const [favorites, setFavorites] = useState(readFavorites);
  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener(FAVORITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAVORITES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return favorites;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let refilling: Promise<Deck> | null = null;

function refill(settings: BackdropSettings): Promise<Deck> {
  const source = sourceOf(settings);
  const { favoritesOnly } = settings;
  const fetching = () =>
    favoritesOnly ? Promise.resolve(shuffled(readFavorites())) : fetchPhotos(settings.topic, settings.query);
  refilling ??= fetching()
    .then((photos) => {
      const deck = readDeck(source);
      const queue = favoritesOnly ? deck.queue.filter((p) => photos.some((f) => f.id === p.id)) : deck.queue;
      const seen = new Set([deck.current?.id, ...queue.map((p) => p.id)]);
      const next = { ...deck, queue: [...queue, ...photos.filter((p) => !seen.has(p.id))] };
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

const isDue = (deck: Deck, frequency: Frequency) =>
  !deck.current || Date.now() - deck.shownAt >= FREQUENCY_MS[frequency];

function decode(src: string): Promise<boolean> {
  const img = new Image();
  img.src = src;
  return img.decode().then(
    () => true,
    () => false
  );
}

type Layer = { photo: BackdropPhoto; src: string; fadeMs: number };

function useParallax(enabled: boolean) {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        stage.style.setProperty("--px", `${x * -PARALLAX_PX}px`);
        stage.style.setProperty("--py", `${y * -PARALLAX_PX}px`);
      });
    };
    const onMove = (e: PointerEvent) => move(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
    const onLeave = () => move(0, 0);
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      stage.style.removeProperty("--px");
      stage.style.removeProperty("--py");
    };
  }, [enabled]);
  return stageRef;
}

export default function Backdrop() {
  const [settings] = useBackdropSettings();
  const favorites = useFavorites();
  const [placeholder] = useState(() => readDeck(sourceOf(readSettings())).current?.color);
  const [layers, setLayers] = useState<Layer[]>([]);
  const layersRef = useRef<Layer[]>([]);
  const stageRef = useParallax(settings.motion === "parallax");
  const current = layers.at(-1)?.photo;
  const source = sourceOf(settings);
  const { topic, query, frequency, favoritesOnly } = settings;

  useEffect(() => {
    if (!UNSPLASH_ENABLED) return;
    let cancelled = false;
    const live = { topic, query, frequency, favoritesOnly } as BackdropSettings;

    const show = async (photo: BackdropPhoto) => {
      if (layersRef.current.at(-1)?.photo.id === photo.id) return;
      const src = await loadImage(photoSrc(photo));
      if (!src) return;
      if (cancelled || !(await decode(src))) {
        URL.revokeObjectURL(src);
        return;
      }
      const previous = layersRef.current;
      previous.slice(0, -1).forEach((layer) => URL.revokeObjectURL(layer.src));
      const next = [...previous.slice(-1), { photo, src, fadeMs: previous.length ? 1600 : 500 }];
      layersRef.current = next;
      setLayers(next);
    };

    const step = async (force: boolean) => {
      let deck = readDeck(source);
      if (force || isDue(deck, frequency)) {
        if (!deck.queue.length) deck = await refill(live).catch(() => deck);
        deck = advance(deck) ?? deck;
      }
      if (cancelled) return;
      if (deck.current) await show(deck.current);
      if (deck.queue.length < REFILL_BELOW) deck = await refill(live).catch(() => deck);
      const ahead = deck.queue.slice(0, CACHED_AHEAD);
      await Promise.all(ahead.map((photo) => warmImage(photoSrc(photo))));
      void pruneImages([deck.current, ...ahead].filter((p) => p !== null).map(photoSrc));
    };

    void step(false);
    const onNext = () => void step(true);
    const onShow = (e: Event) => {
      const photo = (e as CustomEvent<BackdropPhoto>).detail;
      const deck = readDeck(source);
      trackDownload(photo);
      writeDeck({ ...deck, current: photo, shownAt: Date.now(), queue: deck.queue.filter((p) => p.id !== photo.id) });
      void show(photo);
    };
    const onRefresh = async () => {
      writeDeck({ ...readDeck(source), queue: [] });
      await refill(live).catch(() => undefined);
      void step(true);
    };
    const timer = setInterval(() => {
      if (!document.hidden && isDue(readDeck(source), frequency)) void step(false);
    }, 60_000);
    window.addEventListener(NEXT_EVENT, onNext);
    window.addEventListener(SHOW_EVENT, onShow);
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener(NEXT_EVENT, onNext);
      window.removeEventListener(SHOW_EVENT, onShow);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
    };
  }, [source, topic, query, frequency, favoritesOnly]);

  const color = current?.color ?? placeholder;

  useEffect(() => {
    if (color) document.documentElement.dataset.backdrop = "photo";
  }, [color]);

  if (!color) return null;

  return (
    <>
      <div
        aria-hidden
        className="backdrop"
        data-motion={settings.motion}
        style={
          {
            backgroundColor: color,
            "--bd-dim": settings.dim / 100,
            "--bd-blur": `${settings.blur}px`,
          } as React.CSSProperties
        }
      >
        <div ref={stageRef} className="backdrop-stage">
          {layers.map(({ photo, src, fadeMs }) => (
            <div
              key={photo.id}
              className="backdrop-layer"
              style={{ backgroundImage: `url("${src}")`, animationDuration: `${fadeMs}ms, 80s` }}
            />
          ))}
        </div>
        <div className="backdrop-scrim" />
      </div>
      {current && (
        <div
          className="backdrop-credit corner-card material squircle"
          data-mode={settings.credit}
          title={current.alt}
        >
          <button
            type="button"
            title={favorites.some((p) => p.id === current.id) ? "Remove from favorites" : "Add to favorites"}
            aria-label="Favorite this photo"
            aria-pressed={favorites.some((p) => p.id === current.id)}
            onClick={() => toggleFavorite(current)}
            className={buttonClass({ variant: "ghost", size: "sm", iconOnly: true }, "favorite-btn")}
          >
            <Icon name="heart" size={13} />
          </button>
          <button
            type="button"
            title="Show another photo"
            aria-label="Show another photo"
            onClick={showNextPhoto}
            className={buttonClass({ variant: "ghost", size: "sm", iconOnly: true })}
          >
            <Icon name="reset" size={13} />
          </button>
          <span key={current.id} className="backdrop-credit-text truncate animate-fade-in">
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
        </div>
      )}
    </>
  );
}
