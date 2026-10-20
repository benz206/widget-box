"use client";

import { useEffect, useState } from "react";
import Button from "./Button";
import Icon from "./Icon";
import { applyAppearance, readAppearance, type Appearance } from "./appearance";

const NEXT: Record<Appearance, Appearance> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const APPEARANCE_ICON = {
  system: "circleHalf",
  light: "sun",
  dark: "moon",
} as const;

export default function AppearanceToggle() {
  const [appearance, setAppearance] = useState<Appearance>("system");

  useEffect(() => {
    setAppearance(readAppearance());
  }, []);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (appearance !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => applyAppearance("system");
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [appearance]);

  return (
    <Button
      variant="ghost"
      iconOnly
      title={`Appearance: ${appearance}`}
      aria-label={`Appearance: ${appearance}. Click to change.`}
      onClick={() => {
        const next = NEXT[appearance];
        setAppearance(next);
        applyAppearance(next);
      }}
    >
      <Icon name={APPEARANCE_ICON[appearance]} size={16} />
    </Button>
  );
}
