const PREFIX = "widget-box:cache:";

type Entry<T> = { at: number; value: T };

function read<T>(key: string): Entry<T> | null {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key) ?? "null");
  } catch {
    return null;
  }
}

export function peek<T>(key: string): T | null {
  return read<T>(key)?.value ?? null;
}

export function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    return;
  }
}

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = read<T>(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await load();
  write(key, value);
  return value;
}

export function clearCache(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  }
}
