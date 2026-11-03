const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined;
const API = "https://api.unsplash.com";
const UTM = "utm_source=widget_box&utm_medium=referral";

export const UNSPLASH_ENABLED = Boolean(ACCESS_KEY);
export const UNSPLASH_HOME = `https://unsplash.com/?${UTM}`;

export const BACKDROP_TOPICS = [
  { value: "bo8jQKTaE0Y", label: "Wallpapers" },
  { value: "6sMVjTLSkeQ", label: "Nature" },
  { value: "Fzo3zuOHN6w", label: "Travel" },
  { value: "M8jVbLbTRws", label: "Architecture" },
  { value: "iUIsnVtjB0Y", label: "Textures" },
  { value: "hmenvQhUmxM", label: "Film" },
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

export async function fetchPhotos(topic: string): Promise<BackdropPhoto[]> {
  const res = await fetch(
    `${API}/photos/random?count=30&orientation=landscape&content_filter=high&topics=${topic}`,
    { headers: headers() }
  );
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
  fetch(photo.downloadUrl, { headers: headers() }).catch(() => undefined);
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
