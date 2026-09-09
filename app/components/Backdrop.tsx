"use client";

import { useEffect, useState } from "react";
import Icon from "./ui/Icon";
import type { BackdropPhoto } from "@/app/api/backdrop/route";

const BACKDROP_KEY = "widget-box:backdrop";
const CHANGED_EVENT = "widget-box:backdrop-changed";
const INTERVAL_MS = 40_000;

function readEnabled(): boolean {
  try {
    return localStorage.getItem(BACKDROP_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeEnabled(enabled: boolean): void {
  if (enabled) localStorage.removeItem(BACKDROP_KEY);
  else localStorage.setItem(BACKDROP_KEY, "off");
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

function useBackdropEnabled(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const sync = () => setEnabled(readEnabled());
    sync();
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [enabled, writeEnabled];
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function preload(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

export function BackdropToggle() {
  const [enabled, setEnabled] = useBackdropEnabled();
  return (
    <button
      type="button"
      title={enabled ? "Hide nature photos" : "Show nature photos"}
      aria-pressed={enabled}
      aria-label="Nature photo backdrop"
      onClick={() => setEnabled(!enabled)}
      className={`press focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-fill hover:text-label ${
        enabled ? "text-label" : "text-secondary"
      }`}
    >
      <Icon name="photo" size={16} />
    </button>
  );
}

export default function Backdrop() {
  const [enabled] = useBackdropEnabled();
  const [photos, setPhotos] = useState<BackdropPhoto[]>([]);
  const [shown, setShown] = useState<BackdropPhoto[]>([]);

  useEffect(() => {
    if (!enabled || photos.length) return;
    let cancelled = false;
    fetch("/api/backdrop")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((list: BackdropPhoto[]) => {
        if (!cancelled && list.length) setPhotos(shuffle(list));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled, photos.length]);

  useEffect(() => {
    if (!enabled || !photos.length) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const show = (index: number) => {
      preload(photos[index].url)
        .then(() => {
          if (cancelled) return;
          setShown((prev) => [...prev.slice(-1), photos[index]]);
          if (photos.length > 1) {
            timer = setTimeout(() => show((index + 1) % photos.length), INTERVAL_MS);
          }
        })
        .catch(() => {
          if (!cancelled && photos.length > 1) show((index + 1) % photos.length);
        });
    };
    show(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, photos]);

  if (!enabled || !shown.length) return null;
  const current = shown[shown.length - 1];

  return (
    <>
      <div aria-hidden className="backdrop">
        {shown.map((photo) => (
          <div
            key={photo.id}
            className="backdrop-layer"
            style={{ backgroundImage: `url("${photo.url}")`, backgroundColor: photo.color }}
          />
        ))}
        <div className="backdrop-scrim" />
      </div>
      <a
        href={current.link}
        target="_blank"
        rel="noopener noreferrer"
        className="material hairline fixed bottom-4 right-4 z-30 rounded-full px-3 py-1.5 text-[11.5px] text-secondary hover:text-label"
      >
        Photo by {current.author.name} on Unsplash
      </a>
    </>
  );
}
