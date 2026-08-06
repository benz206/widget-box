"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./ui/Icon";
import { applyAppearance, readAppearance, type Appearance } from "./ui/appearance";

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

function AppearanceToggle() {
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
    <button
      type="button"
      title={`Appearance: ${appearance}`}
      aria-label={`Appearance: ${appearance}. Click to change.`}
      onClick={() => {
        const next = NEXT[appearance];
        setAppearance(next);
        applyAppearance(next);
      }}
      className="press focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-fill text-secondary hover:text-label"
    >
      <Icon name={APPEARANCE_ICON[appearance]} size={16} />
    </button>
  );
}

export default function AppHeader({
  subtitle,
  children,
}: {
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="material sticky top-0 z-40 w-full border-b border-separator">
      <div className="mx-auto flex h-[52px] max-w-[1160px] items-center gap-3 px-5">
        <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-lg">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[9px] text-white"
            style={{
              background: "linear-gradient(150deg, #0a84ff, #5e5ce6)",
              boxShadow: "0 2px 6px rgba(10,132,255,0.35)",
            }}
          >
            <Icon name="grid" size={15} strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Widget Box</span>
        </Link>
        {subtitle && (
          <span className="text-[15px] text-tertiary">
            <span className="mr-2">/</span>
            {subtitle}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {children}
          <AppearanceToggle />
        </div>
      </div>
    </header>
  );
}
