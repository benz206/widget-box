export type Appearance = "light" | "dark" | "system";

export const APPEARANCE_KEY = "widget-box:appearance";

/**
 * Runs inline in <head> before first paint. Kept as a string (rather than a
 * component effect) so the resolved appearance is on <html> for the very first
 * frame and the page never flashes the wrong palette.
 */
export const APPEARANCE_BOOTSTRAP = `(function(){try{
var p=localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)})||"system";
var d=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.dataset.appearance=d?"dark":"light";
}catch(e){document.documentElement.dataset.appearance="light";}})();`;

export function readAppearance(): Appearance {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(APPEARANCE_KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function applyAppearance(pref: Appearance): void {
  const dark =
    pref === "dark" ||
    (pref === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.appearance = dark ? "dark" : "light";
  if (pref === "system") localStorage.removeItem(APPEARANCE_KEY);
  else localStorage.setItem(APPEARANCE_KEY, pref);
}
