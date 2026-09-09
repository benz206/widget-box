"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./ui/Icon";
import type { BackdropPhoto } from "@/app/api/backdrop/route";

const SETTINGS_KEY = "widget-box:backdrop-settings";
const CHANGED_EVENT = "widget-box:backdrop-changed";
const ROTATION_SECONDS = [30, 60, 120, 300];
const FADE_SECONDS = [1, 2, 4, 8];
const DEFAULT_SETTINGS = { rotation: 60, fade: 4 };
type BackdropSettings = typeof DEFAULT_SETTINGS;

function readSettings(): BackdropSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      rotation: ROTATION_SECONDS.includes(saved.rotation) ? saved.rotation : DEFAULT_SETTINGS.rotation,
      fade: FADE_SECONDS.includes(saved.fade) ? saved.fade : DEFAULT_SETTINGS.fade,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function useBackdropSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  useEffect(() => {
    const sync = () => setSettings(readSettings());
    const onChange = (event: Event) => setSettings((event as CustomEvent<BackdropSettings>).detail);
    sync();
    window.addEventListener(CHANGED_EVENT, onChange);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, onChange);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (patch: Partial<BackdropSettings>) => {
    const next = { ...settings, ...patch };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* Keep session settings when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT, { detail: next }));
  };
  return [settings, update] as const;
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

export function BackdropSettings() {
  const [settings, update] = useBackdropSettings();
  return (
    <>
      <button
        type="button"
        title="Background settings"
        aria-label="Background settings"
        popoverTarget="backdrop-settings"
        className="press focus-ring header-icon text-secondary"
      >
        <Icon name="photo" size={16} />
      </button>
      <div id="backdrop-settings" popover="auto" className="backdrop-settings material" aria-labelledby="backdrop-settings-title">
        <div className="flex items-center justify-between gap-4">
          <h2 id="backdrop-settings-title" className="text-[15px] font-semibold">Background</h2>
          <button type="button" popoverTarget="backdrop-settings" popoverTargetAction="hide" aria-label="Close background settings" className="focus-ring header-icon"><Icon name="xmark" size={15} /></button>
        </div>
        <p className="mb-5 text-[12px] leading-relaxed text-secondary">A changing landscape. At your pace.</p>
        <label className="backdrop-setting">
          <span>Change photo every</span>
          <select className="focus-ring" value={settings.rotation} onChange={(event) => update({ rotation: Number(event.target.value) })}>
            {ROTATION_SECONDS.map((seconds) => <option key={seconds} value={seconds}>{seconds < 60 ? `${seconds} seconds` : `${seconds / 60} ${seconds === 60 ? "minute" : "minutes"}`}</option>)}
          </select>
        </label>
        <label className="backdrop-setting">
          <span>Crossfade duration</span>
          <select className="focus-ring" value={settings.fade} onChange={(event) => update({ fade: Number(event.target.value) })}>
            {FADE_SECONDS.map((seconds) => <option key={seconds} value={seconds}>{seconds} {seconds === 1 ? "second" : "seconds"}</option>)}
          </select>
        </label>
        <p className="mt-4 text-[10px] leading-relaxed text-secondary">Motion follows your device’s accessibility preferences.</p>
      </div>
    </>
  );
}

export default function Backdrop() {
  const [settings] = useBackdropSettings();
  const nextIndex = useRef(0);
  const started = useRef(false);
  const [photos, setPhotos] = useState<BackdropPhoto[]>([]);
  const [shown, setShown] = useState<BackdropPhoto[]>([]);

  useEffect(() => {

    let cancelled = false;
    fetch("/api/backdrop")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((list: BackdropPhoto[]) => {
        if (!cancelled && list.length) setPhotos(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!photos.length) return;
    let cancelled = false;
    let index = nextIndex.current;
    let pending = preload(photos[index].url);

    const show = async () => {
      if (document.hidden) return;
      const loaded = await pending;
      if (cancelled) return;
      const photo = photos[index];
      if (loaded) {
        setShown((prev) =>
          prev.at(-1)?.id === photo.id ? prev : [...prev.slice(-1), photo]
        );
      }
      // Failed images leave the current photo intact. Try the next on the next tick.
      started.current = true;
      index = (index + 1) % photos.length;
      nextIndex.current = index;
      pending = preload(photos[index].url);
    };
    if (!started.current) void show();
    const timer = setInterval(() => { void show(); }, settings.rotation * 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [photos, settings.rotation]);

  if (!shown.length) return null;
  const current = shown[shown.length - 1];

  return (
    <>
      <div aria-hidden className="backdrop">
        {shown.map((photo) => (
          <div
            key={photo.id}
            className="backdrop-layer"
            style={{ backgroundImage: `url("${photo.url}")`, animationDuration: `${settings.fade}s, ${settings.rotation + settings.fade}s` }}
          />
        ))}
        <div className="backdrop-scrim" />
      </div>
      <a
        href={current.link}
        target="_blank"
        rel="noopener noreferrer"
        title={current.alt}
        className="backdrop-credit focus-ring"
      >
        <Icon name="photo" size={13} />
        Landscapes by Lorem Picsum
      </a>
    </>
  );
}
