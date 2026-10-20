"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Icon, { type IconName } from "./ui/Icon";
import Button from "./ui/Button";
import AppearanceToggle from "./ui/AppearanceToggle";
import { BackdropSettings } from "./Backdrop";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/marketplace", label: "Widget library", icon: "store" },
  { href: "/setup", label: "Setup", icon: "wand" },
];

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Account() {
  const { data, status } = useSession();

  if (status === "loading") return <div className="account" aria-hidden><span className="avatar" /></div>;

  if (!data?.user) {
    return (
      <Link href="/login" className="nav-item focus-ring">
        <Icon name="person" size={16} />
        <span>Sign in</span>
      </Link>
    );
  }

  const name = data.user.name ?? data.user.email ?? "Account";
  return (
    <div className="account">
      <span className="avatar" aria-hidden>{initials(name)}</span>
      <div className="account-name">
        <div className="truncate text-[13px] font-medium">{name}</div>
        {data.user.email && <div className="truncate text-[12px] text-secondary">{data.user.email}</div>}
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Sign out"
        title="Sign out"
        onClick={() => signOut({ redirectTo: "/" })}
      >
        <Icon name="logout" size={15} />
      </Button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <aside className="sidebar material">
        <Link href="/" className="sidebar-brand focus-ring" aria-label="Widget Box home">
          <span className="brand-mark"><Icon name="grid" size={14} strokeWidth={2} /></span>
          <span>Widget Box</span>
        </Link>
        <nav aria-label="Main navigation" className="sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="nav-item focus-ring"
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-tools">
            <BackdropSettings />
            <AppearanceToggle />
          </div>
          <Account />
        </div>
      </aside>
      {children}
    </div>
  );
}
