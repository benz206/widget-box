import { apiKey } from "@/lib/storage/keys";
import { recordRequest } from "./usage";

const ACCESS_KEY = apiKey("unsplash");
const API = "https://api.unsplash.com";
const UTM = "utm_source=widget_box&utm_medium=referral";
const IMAGE_CACHE = "widget-box:photos";

export const UNSPLASH_ENABLED = Boolean(ACCESS_KEY);
export const UNSPLASH_HOME = `https://unsplash.com/?${UTM}`;
export const CUSTOM_TOPIC = "custom";
export const FAVORITES_TOPIC = "favorites";

export const BACKDROP_TOPICS = [
  { value: "bo8jQKTaE0Y", label: "Wallpapers" },
  { value: "bo8jQKTaE0Y,6sMVjTLSkeQ,Fzo3zuOHN6w,M8jVbLbTRws", label: "Mix: wallpapers, nature, travel, architecture" },
  { value: "6sMVjTLSkeQ", label: "Nature" },
  { value: "bk0hPaquVeE", label: "Fall" },
  { value: "Fzo3zuOHN6w", label: "Travel" },
  { value: "M8jVbLbTRws", label: "Architecture" },
  { value: "xHxYTMHLgOc", label: "Street photography" },
  { value: "hmenvQhUmxM", label: "Film" },
  { value: "Jpg6Kidl-Hk", label: "Animals" },
  { value: "CDwuwXJAbEw", label: "3D renders" },
  { value: "qPYsDzvJOYc", label: "Experimental" },
  { value: "iUIsnVtjB0Y", label: "Textures" },
  { value: "upmleWZC83Y", label: "Patterns" },
  { value: "If65AuNOOxQ", label: "Illustrated wallpapers" },
  { value: "M4lsf7LQDRA", label: "Illustrated nature" },
  { value: CUSTOM_TOPIC, label: "Custom search…" },
];

export type BackdropPhoto = {
  id: string;
  raw: string;
  color: string;
  alt: string;
  location?: string;
  author: string;
  authorUrl: string;
  downloadUrl: string;
};

type ApiPhoto = {
  id: string;
  color: string | null;
  alt_description: string | null;
  urls: { raw: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
  location?: { name: string | null };
};

const headers = () => ({ Authorization: `Client-ID ${ACCESS_KEY}`, "Accept-Version": "v1" });

export async function fetchPhotos(topic: string, query: string): Promise<BackdropPhoto[]> {
  const filter =
    topic === CUSTOM_TOPIC ? `query=${encodeURIComponent(query || "landscape")}` : `topics=${topic}`;
  const res = await fetch(
    `${API}/photos/random?count=30&orientation=landscape&content_filter=high&${filter}`,
    { headers: headers() }
  );
  recordRequest("unsplash", res);
  if (!res.ok) throw new Error(`Unsplash responded ${res.status}`);
  const photos = (await res.json()) as ApiPhoto[];
  return photos.map((photo) => ({
    id: photo.id,
    raw: photo.urls.raw,
    color: photo.color ?? "#1c1c1e",
    alt: photo.alt_description ?? "Photo from Unsplash",
    location: photo.location?.name ?? undefined,
    author: photo.user.name,
    authorUrl: `${photo.user.links.html}?${UTM}`,
    downloadUrl: photo.links.download_location,
  }));
}

export function trackDownload(photo: BackdropPhoto): void {
  fetch(photo.downloadUrl, { headers: headers() })
    .then((res) => recordRequest("unsplash", res))
    .catch(() => undefined);
}

export function photoSrc(photo: BackdropPhoto): string {
  const width = Math.min(3840, Math.ceil((screen.width * devicePixelRatio) / 640) * 640);
  const url = new URL(photo.raw);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", "80");
  url.searchParams.set("fm", "jpg");
  url.searchParams.set("fit", "max");
  return url.toString();
}

async function cachedResponse(url: string): Promise<Response | null> {
  const cache = await caches.open(IMAGE_CACHE);
  const hit = await cache.match(url);
  if (hit) return hit;
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) return null;
  await cache.put(url, res.clone());
  return res;
}

export async function loadImage(url: string): Promise<string | null> {
  try {
    const res = await cachedResponse(url);
    return res ? URL.createObjectURL(await res.blob()) : null;
  } catch {
    return null;
  }
}

export async function warmImage(url: string): Promise<void> {
  try {
    await cachedResponse(url);
  } catch {
    return;
  }
}

export async function pruneImages(keep: string[]): Promise<void> {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    for (const request of await cache.keys()) {
      if (!keep.includes(request.url)) await cache.delete(request);
    }
  } catch {
    return;
  }
}

export async function imageCacheStats(): Promise<{ count: number; bytes: number }> {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const responses = await Promise.all((await cache.keys()).map((request) => cache.match(request)));
    const sizes = await Promise.all(responses.map(async (res) => (res ? (await res.blob()).size : 0)));
    return { count: sizes.length, bytes: sizes.reduce((sum, size) => sum + size, 0) };
  } catch {
    return { count: 0, bytes: 0 };
  }
}
