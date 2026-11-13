import { useCallback, useRef, useState } from "react";

const PREFIX = "widget-box:widget-state:v1:";

const key = (instanceId: string, name: string) =>
  `${PREFIX}${instanceId}:${name}`;

function read<T>(storageKey: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    // Corrupt entry — fall back to the initial value.
    return null;
  }
}

/**
 * Per-instance persisted state for widgets that hold their own data — a
 * running timer, a note, a pet. Separate from instance *config* so writing to
 * it never re-resolves a widget's settings.
 */
export function useWidgetState<T>(
  instanceId: string,
  name: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const storageKey = key(instanceId, name);
  const [value, setValue] = useState<T>(() => read(storageKey) ?? initial);
  const valueRef = useRef(value);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(valueRef.current)
          : next;
      valueRef.current = resolved;
      setValue(resolved);
      try {
        localStorage.setItem(storageKey, JSON.stringify(resolved));
      } catch {
        // Quota or private mode — keep the in-memory value.
      }
    },
    [storageKey]
  );

  return [value, update];
}

/** Drops everything a removed instance was holding on to. */
export function clearWidgetState(instanceId: string): void {
  if (typeof window === "undefined") return;
  const prefix = `${PREFIX}${instanceId}:`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (!k?.startsWith(prefix)) continue;
    try {
      localStorage.removeItem(k);
    } catch {
      return;
    }
  }
}
