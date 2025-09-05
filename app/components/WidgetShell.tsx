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
          "group relative overflow-hidden rounded-2xl h-full w-full",
          "bg-white/5 backdrop-blur-xl border border-white/10",
          "shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30",
          "hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300",
          "p-6 flex flex-col",
        ].join(" ")}
      >
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
          <div className="absolute -top-1/2 -left-1/3 h-[200%] w-[200%] bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        {/* Header with improved typography */}
        {(title || subtitle) && (
          <header className="z-10 flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-white mb-1 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-white/60 truncate">{subtitle}</p>
              )}
            </div>
            {/* Subtle menu indicator */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
              <div className="w-1 h-1 rounded-full bg-white/40"></div>
            </div>
          </header>
        )}

        {/* Content area with better spacing */}
        <div className="z-10 flex-1 flex items-center justify-center relative">
          {children}
        </div>

        {/* Subtle hover effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </section>
    </div>
  );
}

export default WidgetShell;
