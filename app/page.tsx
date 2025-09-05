"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getServerAuthSession } from "@/lib/auth";
import { listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";
import WidgetTile from "./components/WidgetTile";

registerSystemWidgets();

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [widgetsWithData, setWidgetsWithData] = useState<any[]>([]);
  const [widgetPositions, setWidgetPositions] = useState<
    Record<string, { x: number; y: number; w: number; h: number }>
  >({});
  const [dropPreview, setDropPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    // Load session and widgets on client side
    const loadData = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        const widgetsList = listWidgets();
        setWidgets(widgetsList);

        // Fetch data for each widget (simple defaults)
        const widgetsWithData = await Promise.all(
          widgetsList.map(async (w) => {
            const data = await w.fetchData({} as any, { now: new Date() });
            const display = w.toDisplay
              ? w.toDisplay(data as any)
              : (data as any);
            return { def: w, display } as const;
          })
        );
        setWidgetsWithData(widgetsWithData);

        // Initialize positions
        const initialPositions: Record<
          string,
          { x: number; y: number; w: number; h: number }
        > = {};
        widgetsList.forEach((w, index) => {
          initialPositions[w.meta.id] = {
            x: index % 5,
            y: Math.floor(index / 5),
            w: 1,
            h: 1,
          };
        });
        setWidgetPositions(initialPositions);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const handlePositionChange = (
    widgetId: string,
    newX: number,
    newY: number
  ) => {
    setWidgetPositions((prev) => ({
      ...prev,
      [widgetId]: {
        ...prev[widgetId],
        x: newX,
        y: newY,
      },
    }));
  };

  const handleDropPreview = (x: number, y: number) => {
    setDropPreview({ x, y });
  };

  const clearDropPreview = () => {
    setDropPreview(null);
  };

  const user = session?.user;

  return (
    <div className="min-h-screen">
      {/* Modern sticky header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                widget-box
              </h1>
            </div>
          </div>

          <nav className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-white/90">
                    {user.email}
                  </span>
                </div>
                <button className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200">
                  Settings
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-sm font-semibold shadow-lg hover:bg-white/90 transition-all duration-200 hover:shadow-xl"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
            Your Dashboard
          </h2>
          <p className="text-white/60 text-lg">
            Manage your widgets and customize your workspace
          </p>
        </div>

        {widgetsWithData.length > 0 ? (
          <div className="widget-grid">
            {/* Render drop preview */}
            {dropPreview && (
              <div
                className="drop-preview"
                style={{
                  gridColumn: `${dropPreview.x + 1} / span 1`,
                  gridRow: `${dropPreview.y + 1} / span 1`,
                }}
              />
            )}

            {widgetsWithData.map(({ def, display }, index) => (
              <WidgetTile
                key={def.meta.id}
                id={def.meta.id}
                title={def.meta.name}
                subtitle={def.meta.provider}
                size={def.meta.size as any}
                initial={display}
                position={
                  widgetPositions[def.meta.id] || {
                    x: index % 5,
                    y: Math.floor(index / 5),
                    w: 1,
                    h: 1,
                  }
                }
                isDraggable={true}
                isResizable={true}
                onPositionChange={(x, y) =>
                  handlePositionChange(def.meta.id, x, y)
                }
                onDropPreview={handleDropPreview}
                onDragEnd={clearDropPreview}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in">
            <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 animate-scale-in">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">W</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              No widgets available
            </h3>
            <p className="text-white/60 max-w-md text-center">
              It looks like there are no widgets configured yet. Check back
              later or contact your administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Preview({ meta }: { meta: { name: string; desc?: string } }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-semibold tracking-tight drop-shadow-[0_1px_0_rgba(255,255,255,.4)]">
        {meta.name}
      </div>
      {meta.desc && (
        <div className="text-xs mt-1 opacity-80 max-w-[18ch]">{meta.desc}</div>
      )}
    </div>
  );
}
