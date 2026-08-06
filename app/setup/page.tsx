"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppHeader from "@/app/components/AppHeader";
import Icon from "@/app/components/ui/Icon";
import StepFinish from "@/app/components/setup/StepFinish";
import StepPreferences, { type Prefs } from "@/app/components/setup/StepPreferences";
import StepPreset, { type PresetId } from "@/app/components/setup/StepPreset";
import StepWelcome from "@/app/components/setup/StepWelcome";
import {
  createEmptyDashboard,
  createInstance,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  findFirstFit,
  useDashboard,
} from "@/lib/storage/dashboard";
import { getWidgetById } from "@/lib/widgets/registry";
import { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "@/lib/widgets/system";
import { WIDGET_SIZES, type WidgetPosition, type WidgetSize } from "@/lib/widgets/types";

registerSystemWidgets();

const STEPS = ["Welcome", "Widgets", "Details", "Done"] as const;

/** Seeds a new instance's config from the answers given during setup. */
function initialConfig(widgetId: string, prefs: Prefs): Record<string, unknown> {
  switch (widgetId) {
    case "system.clock":
      return { hour12: prefs.hour12, timezone: prefs.timezone };
    case "system.weather":
      return { city: prefs.weatherCity, units: prefs.units };
    case "system.astronomy":
      return { city: prefs.weatherCity };
    default:
      return {};
  }
}

export default function SetupPage() {
  const router = useRouter();
  const { state, actions } = useDashboard(SYSTEM_WIDGET_IDS);

  const [step, setStep] = useState(0);
  const [presetId, setPresetId] = useState<PresetId | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<Prefs>({
    displayName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour12: true,
    weatherCity: "San Francisco",
    units: "c",
  });

  // Lay the chosen widgets out up front, so the summary can report what fit.
  const layout = useMemo(() => {
    const taken: WidgetPosition[] = [];
    const placements: { widgetId: string; size: WidgetSize; position: WidgetPosition }[] = [];
    const dropped: string[] = [];

    for (const widgetId of selected) {
      const definition = getWidgetById(widgetId);
      if (!definition) continue;
      const size = definition.meta.defaultSize;
      const span = WIDGET_SIZES[size];
      const spot = findFirstFit(taken, span.w, span.h, DEFAULT_COLS, DEFAULT_ROWS);
      if (!spot) {
        dropped.push(widgetId);
        continue;
      }
      taken.push(spot);
      placements.push({ widgetId, size, position: spot });
    }
    return { placements, dropped };
  }, [selected]);

  const canContinue = step !== 1 || selected.length > 0;

  const finish = () => {
    actions.replaceState({
      ...createEmptyDashboard(),
      setupComplete: true,
      preferences: {
        displayName: prefs.displayName || undefined,
        timezone: prefs.timezone || undefined,
        hour12: prefs.hour12,
        weatherCity: prefs.weatherCity || undefined,
        units: prefs.units,
        gridCols: DEFAULT_COLS,
        gridRows: DEFAULT_ROWS,
      },
      instances: layout.placements.map(({ widgetId, size, position }) =>
        createInstance(widgetId, {
          size,
          position,
          config: initialConfig(widgetId, prefs),
        })
      ),
    });
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader subtitle="Setup">
        <span className="text-[13px] text-tertiary">
          Step {step + 1} of {STEPS.length}
        </span>
        <div className="flex gap-1">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className="h-1.5 rounded-full"
              style={{
                width: i === step ? 18 : 6,
                background:
                  i === step
                    ? "var(--accent)"
                    : i < step
                      ? "var(--label-tertiary)"
                      : "var(--fill-tertiary)",
                transition: "all 260ms var(--ease-ios)",
              }}
            />
          ))}
        </div>
      </AppHeader>

      {state !== null && state.instances.length > 0 && (
        <div
          className="flex items-center justify-center gap-3 border-b border-separator px-5 py-2.5 text-[12.5px]"
          style={{ background: "color-mix(in srgb, var(--warning) 12%, transparent)" }}
        >
          <span style={{ color: "var(--warning)" }}>
            Finishing setup replaces your current dashboard.
          </span>
          <Link href="/" className="focus-ring font-semibold text-accent">
            Cancel
          </Link>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10">
        <div
          className="material hairline rounded-[20px] p-7"
          style={{ boxShadow: "var(--tile-shadow)" }}
        >
          {step === 0 && <StepWelcome />}
          {step === 1 && (
            <StepPreset
              presetId={presetId}
              selected={selected}
              onPickPreset={(id, widgetIds) => {
                setPresetId(id);
                setSelected(widgetIds);
              }}
              onToggleWidget={(widgetId) =>
                setSelected((prev) =>
                  prev.includes(widgetId)
                    ? prev.filter((id) => id !== widgetId)
                    : [...prev, widgetId]
                )
              }
            />
          )}
          {step === 2 && (
            <StepPreferences
              prefs={prefs}
              onChange={(patch) => setPrefs((prev) => ({ ...prev, ...patch }))}
              selected={selected}
            />
          )}
          {step === 3 && (
            <StepFinish
              widgetIds={selected}
              displayName={prefs.displayName || undefined}
              dropped={layout.dropped}
              onFinish={finish}
            />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="press focus-ring flex items-center gap-1 text-[14px] font-medium text-secondary"
            >
              <Icon name="chevronLeft" size={14} strokeWidth={2.2} />
              Back
            </button>
          ) : (
            <Link
              href="/"
              className="focus-ring text-[14px] font-medium text-tertiary hover:text-secondary"
            >
              Skip setup
            </Link>
          )}

          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="press focus-ring rounded-full px-6 py-2.5 text-[14px] font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--accent)" }}
            >
              Continue
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
