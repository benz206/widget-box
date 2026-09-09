"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "./ui/Icon";
import { BackdropSettings } from "./Backdrop";
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
      className="press focus-ring header-icon text-secondary"
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
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="header-bar material">
        <Link href="/" className="focus-ring brand" aria-label="Widget Box home">
          <span className="brand-mark"><Icon name="grid" size={20} strokeWidth={1.8} /></span>
          <span className="brand-name">Widget Box<span>Your everyday, beautifully.</span></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className="focus-ring">
            <Icon name="grid" size={15} /> My space
          </Link>
          <Link href="/marketplace" aria-current={pathname === "/marketplace" ? "page" : undefined} className="focus-ring">
            <Icon name="plus" size={16} /> Discover
          </Link>
        </nav>
        <div className="header-actions">
          {subtitle && <span className="header-subtitle">{subtitle}</span>}
          {children}
          <span className="header-divider" aria-hidden />
          <BackdropSettings />
          <AppearanceToggle />
        </div>
      </div>
    </header>
  );
}
