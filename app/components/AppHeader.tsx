"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./ui/Icon";
import { BackdropSettings } from "./Backdrop";
import AppearanceToggle from "./ui/AppearanceToggle";

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
