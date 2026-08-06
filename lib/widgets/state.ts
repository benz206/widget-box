"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PREFIX = "widget-box:widget-state:v1:";

const key = (instanceId: string, name: string) =>
  `${PREFIX}${instanceId}:${name}`;

/**
 * Per-instance persisted state for widgets that hold their own data — a
 * running timer, a note, a pet. Separate from instance *config* so writing to
 * it never re-resolves a widget's settings.
 *
 * Reads happen after mount so server and first client render agree.
 */
export function useWidgetState<T>(
  instanceId: string,
  name: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const storageKey = key(instanceId, name);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Corrupt entry — fall back to the initial value.
    }
    setLoaded(true);
  }, [storageKey]);

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

  return [value, update, loaded];
}

/** Drops everything a removed instance was holding on to. */
export function clearWidgetState(instanceId: string): void {
  if (typeof window === "undefined") return;
  const prefix = `${PREFIX}${instanceId}:`;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) localStorage.removeItem(k);
  }
}
