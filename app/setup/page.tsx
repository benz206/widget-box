"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Button, { ButtonLink } from "@/app/components/ui/Button";
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

const STEPS = [
  { label: "Welcome", hint: "What this is" },
  { label: "Widgets", hint: "Pick a starting set" },
  { label: "Details", hint: "Name, time, and place" },
  { label: "Done", hint: "Review and finish" },
] as const;

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

  const last = step === STEPS.length - 1;

  return (
    <div className="onboarding">
      <header className="onboarding-bar material">
        <Link href="/" className="sidebar-brand focus-ring" aria-label="Widget Box home">
          <span className="brand-mark"><Icon name="grid" size={14} strokeWidth={2} /></span>
          <span>Widget Box</span>
        </Link>
        <ButtonLink href="/" variant="ghost" size="sm">
          {state?.setupComplete ? "Exit setup" : "Skip setup"}
        </ButtonLink>
      </header>

      <div className="onboarding-body">
        <nav aria-label="Setup progress" className="stepper">
          <ol>
            {STEPS.map(({ label, hint }, i) => (
              <li
                key={label}
                data-state={i < step ? "done" : i === step ? "current" : "upcoming"}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="stepper-dot">
                  {i < step ? <Icon name="check" size={12} strokeWidth={2.6} /> : i + 1}
                </span>
                <span>
                  <span className="stepper-label">{label}</span>
                  <span className="stepper-hint">{hint}</span>
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-3">
          {state !== null && state.instances.length > 0 && (
            <p className="callout" data-tone="warning">
              <Icon name="alert" size={14} />
              Finishing setup replaces your current dashboard.
            </p>
          )}

          <section className="card">
            <div className="onboarding-content">
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
                />
              )}
            </div>

            <footer className="onboarding-footer">
              {step > 0 ? (
                <Button onClick={() => setStep((s) => s - 1)}>
                  <Icon name="chevronLeft" size={14} />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <span className="tabular text-[12px] text-secondary">
                Step {step + 1} of {STEPS.length}
              </span>
              {last ? (
                <Button variant="primary" onClick={finish}>
                  Open dashboard
                  <Icon name="arrowRight" size={14} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canContinue}
                >
                  Continue
                  <Icon name="arrowRight" size={14} />
                </Button>
              )}
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
