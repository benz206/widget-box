const KEY = "widget-box:api-keys";

export type ApiKeyName = "unsplash" | "spotify";

const DEFAULTS: Record<ApiKeyName, string | undefined> = {
  unsplash: import.meta.env.VITE_UNSPLASH_ACCESS_KEY,
  spotify: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
};

function readSaved(): Partial<Record<ApiKeyName, string>> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function apiKey(name: ApiKeyName): string | undefined {
  return readSaved()[name] || DEFAULTS[name] || undefined;
}

export function saveApiKey(name: ApiKeyName, value: string): void {
  localStorage.setItem(KEY, JSON.stringify({ ...readSaved(), [name]: value.trim() }));
}
