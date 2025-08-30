"use client";
import React from "react";

type WidgetShellProps = {
  title?: string;
  subtitle?: string;
  size: "small" | "medium" | "large" | "wide" | "tall";
  children: React.ReactNode;
};

const sizeToGrid: Record<WidgetShellProps["size"], string> = {
  small: "col-span-2",
  medium: "col-span-4",
  large: "col-span-4",
  wide: "col-span-6",
  tall: "col-span-2",
};

export function WidgetShell({
  title,
  subtitle,
  size,
  children,
}: WidgetShellProps) {
  return (
    <div className={["aspect-square", sizeToGrid[size]].join(" ")}>
      <section
        className={[
          "relative overflow-hidden rounded-3xl h-full w-full",
          "border border-white/20 dark:border-white/10",
          "bg-white/30 dark:bg-white/10",
          "backdrop-blur-2xl shadow-[0_8px_30px_rgb(0_0_0/0.12)]",
          "p-4 flex flex-col",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 via-white/10 to-transparent mix-blend-overlay" />
          <div className="absolute -top-1/2 -left-1/3 h-[200%] w-[200%] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.35),transparent_40%)]" />
        </div>

        {(title || subtitle) && (
          <header className="z-10 flex items-baseline justify-between mb-2">
            <div>
              {title && (
                <h3 className="text-sm font-semibold drop-shadow-[0_1px_0_rgba(255,255,255,.3)]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-white/80 dark:text-neutral-200/70">
                  {subtitle}
                </p>
              )}
            </div>
          </header>
        )}
        <div className="z-10 flex-1 flex items-center justify-center">
          {children}
        </div>
      </section>
    </div>
  );
}

export default WidgetShell;
