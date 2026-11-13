export type Appearance = "light" | "dark" | "system";

export const APPEARANCE_KEY = "widget-box:appearance";

export function readAppearance(): Appearance {
  const v = localStorage.getItem(APPEARANCE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function applyAppearance(pref: Appearance): void {
  const dark =
    pref === "dark" ||
    (pref === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.appearance = dark ? "dark" : "light";
  try {
    if (pref === "system") localStorage.removeItem(APPEARANCE_KEY);
    else localStorage.setItem(APPEARANCE_KEY, pref);
  } catch {
    return;
  }
}
