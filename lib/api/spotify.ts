import { apiKey } from "@/lib/storage/keys";

const CLIENT_ID = apiKey("spotify");
const ACCOUNTS = "https://accounts.spotify.com";
const API = "https://api.spotify.com/v1";
const KEY = "widget-box:spotify";
const CHANGED_EVENT = "widget-box:spotify-changed";
const SCOPES = "user-read-currently-playing";

export const SPOTIFY_ENABLED = Boolean(CLIENT_ID);
export const SPOTIFY_CAN_CONNECT = typeof chrome !== "undefined" && Boolean(chrome.identity);

type Tokens = { access: string; refresh: string; expiresAt: number };

export type NowPlaying = {
  title: string;
  artist: string;
  art: string | null;
  durationMs: number;
  progressMs: number;
  playing: boolean;
  fetchedAt: number;
};

type TokenResponse = { access_token: string; refresh_token?: string; expires_in: number };

type ApiItem = {
  name: string;
  duration_ms: number;
  artists?: { name: string }[];
  album?: { images: { url: string; width: number }[] };
  show?: { name: string; images: { url: string; width: number }[] };
  images?: { url: string; width: number }[];
};

function readTokens(): Tokens | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as Tokens | null;
  } catch {
    return null;
  }
}

function writeTokens(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(KEY, JSON.stringify(tokens));
    else localStorage.removeItem(KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function isConnected(): boolean {
  return readTokens() !== null;
}

export function disconnectSpotify(): void {
  writeTokens(null);
}

export function onConnectionChange(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener(CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function requestTokens(params: Record<string, string>, previous?: Tokens): Promise<Tokens> {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID!, ...params }),
  });
  if (!res.ok) {
    if (res.status === 400) writeTokens(null);
    throw new Error("Spotify sign-in expired.");
  }
  const body = (await res.json()) as TokenResponse;
  const tokens = {
    access: body.access_token,
    refresh: body.refresh_token ?? previous?.refresh ?? "",
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  writeTokens(tokens);
  return tokens;
}

export async function connectSpotify(): Promise<void> {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
  const redirectUri = chrome.identity.getRedirectURL();

  const authUrl = `${ACCOUNTS}/authorize?${new URLSearchParams({
    client_id: CLIENT_ID!,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    code_challenge_method: "S256",
    code_challenge: base64Url(new Uint8Array(digest)),
  })}`;

  const result = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
  const params = new URL(result ?? "").searchParams;
  const code = params.get("code");
  if (params.get("state") !== state || !code) {
    throw new Error(params.get("error") ?? "Spotify sign-in failed.");
  }

  await requestTokens({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
}

async function accessToken(): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new Error("Not connected to Spotify.");
  if (tokens.expiresAt - Date.now() > 60_000) return tokens.access;
  const fresh = await requestTokens(
    { grant_type: "refresh_token", refresh_token: tokens.refresh },
    tokens
  );
  return fresh.access;
}

export async function fetchNowPlaying(signal: AbortSignal): Promise<NowPlaying | null> {
  const res = await fetch(`${API}/me/player/currently-playing?additional_types=episode`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    signal,
  });
  if (res.status === 204) return null;
  if (res.status === 401) {
    writeTokens(null);
    throw new Error("Spotify sign-in expired.");
  }
  if (res.status === 429) throw new Error("Spotify is rate limiting requests.");
  if (!res.ok) throw new Error("Spotify is unavailable.");

  const body = (await res.json()) as {
    is_playing: boolean;
    progress_ms: number | null;
    item: ApiItem | null;
  };
  const item = body.item;
  if (!item) return null;

  const images = item.album?.images ?? item.images ?? item.show?.images ?? [];
  return {
    title: item.name,
    artist: item.artists?.map((a) => a.name).join(", ") ?? item.show?.name ?? "",
    art: images[0]?.url ?? null,
    durationMs: item.duration_ms,
    progressMs: body.progress_ms ?? 0,
    playing: body.is_playing,
    fetchedAt: Date.now(),
  };
}
