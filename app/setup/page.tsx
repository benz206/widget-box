"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerSystemWidgets } from "@/lib/widgets/system";
import { getWidgetById } from "@/lib/widgets/registry";
import { WIDGET_SIZES } from "@/lib/widgets/types";
import {
  useDashboard,
  createInstance,
  findFirstFit,
  createEmptyDashboard,
  type WidgetInstance,
} from "@/lib/storage/dashboard";
import { PRESETS } from "@/app/components/setup/StepPreset";

import StepWelcome from "@/app/components/setup/StepWelcome";
import StepPreset from "@/app/components/setup/StepPreset";
import StepPreferences, { type Prefs } from "@/app/components/setup/StepPreferences";
import StepFinish from "@/app/components/setup/StepFinish";

registerSystemWidgets();

const STEP_LABELS = ["Welcome", "Preset", "Preferences", "Finish"];

function buildInitialConfigForWidget(widgetId: string, prefs: Prefs): Record<string, unknown> {
  if (widgetId === "system.clock") {
    return { hour12: prefs.hour12, timezone: prefs.timezone || undefined };
  }
  if (widgetId === "system.weather") {
    return { city: prefs.defaultCity || "San Francisco", units: prefs.units || "c" };
  }
  return {};
}

export default function SetupPage() {
  const router = useRouter();
  const { state, actions } = useDashboard();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({
    displayName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour12: true,
    defaultCity: "San Francisco",
    units: "c",
  });

  const handlePresetChange = (id: string, widgetIds: string[]) => {
    setPresetId(id);
    setSelectedWidgets(widgetIds);
  };

  const handleCustomToggle = (widgetId: string) => {
    setSelectedWidgets((prev) =>
      prev.includes(widgetId) ? prev.filter((w) => w !== widgetId) : [...prev, widgetId]
    );
  };

  const handlePrefsChange = (patch: Partial<Prefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  };

  const canContinue =
    step === 0 ||
    (step === 1 && presetId !== null && (presetId !== "custom" || selectedWidgets.length > 0)) ||
    step === 2 ||
    step === 3;

  const handleFinish = () => {
    const cols = 5;
    const rows = 5;
    const taken: { x: number; y: number; w: number; h: number }[] = [];
    const instances: WidgetInstance[] = [];

    for (const widgetId of selectedWidgets) {
      const def = getWidgetById(widgetId);
      if (!def) continue;
      const size = def.meta.size;
      const span = WIDGET_SIZES[size];
      const spot = findFirstFit(taken, span.w, span.h, cols, rows);
      if (!spot) break;
      const config = buildInitialConfigForWidget(widgetId, prefs);
      const instance = createInstance(widgetId, {
        size,
        position: { ...spot, w: span.w, h: span.h },
        config,
      });
      taken.push(instance.position);
      instances.push(instance);
    }

    actions.replaceState({
      ...createEmptyDashboard(),
      setupComplete: true,
      preferences: {
        displayName: prefs.displayName || undefined,
        timezone: prefs.timezone || undefined,
        hour12: prefs.hour12,
        defaultCity: prefs.defaultCity || undefined,
        units: prefs.units,
      },
      instances,
    });

    router.push("/");
  };

  const handleContinue = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as 0 | 1 | 2 | 3);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => (s - 1) as 0 | 1 | 2 | 3);
  };

  const presetName =
    PRESETS.find((p) => p.id === presetId)?.name ?? "Custom";

  const alreadySetup = state?.setupComplete === true;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              widget-box{" "}
              <span className="text-white/40 font-normal">• Setup</span>
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50">
              Step {step + 1} of {STEP_LABELS.length}
            </span>
            <div className="flex gap-1.5">
              {STEP_LABELS.map((_, i) => (
                <span
                  key={i}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    i === step
                      ? "w-4 bg-blue-400"
                      : i < step
                      ? "w-1.5 bg-white/40"
                      : "w-1.5 bg-white/15",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Already-setup banner */}
      {alreadySetup && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-center gap-3">
          <span className="text-amber-300/80 text-xs">
            You already have a dashboard. Continuing will replace it.
          </span>
          <Link href="/" className="text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200">
            Cancel
          </Link>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/30 p-8">
          {step === 0 && <StepWelcome />}
          {step === 1 && (
            <StepPreset
              presetId={presetId}
              selectedWidgets={selectedWidgets}
              onChange={handlePresetChange}
              onCustomToggle={handleCustomToggle}
            />
          )}
          {step === 2 && (
            <StepPreferences
              prefs={prefs}
              onChange={handlePrefsChange}
              selectedWidgetIds={selectedWidgets}
            />
          )}
          {step === 3 && (
            <StepFinish
              presetName={presetName}
              widgetCount={selectedWidgets.length}
              displayName={prefs.displayName || undefined}
              onFinish={handleFinish}
            />
          )}
        </div>

        {/* Navigation row */}
        <div className="w-full max-w-3xl flex items-center justify-between mt-4 px-1">
          <div>
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>

          {step < 3 && (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={[
                "px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
                canContinue
                  ? "bg-white text-black hover:bg-white/90 active:scale-95"
                  : "bg-white/10 text-white/30 cursor-not-allowed",
              ].join(" ")}
            >
              Continue →
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
