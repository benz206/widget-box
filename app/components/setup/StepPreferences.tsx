"use client";

import Segmented from "@/app/components/ui/Segmented";

export type Prefs = {
  displayName: string;
  timezone: string;
  hour12: boolean;
  weatherCity: string;
  units: "c" | "f";
};

const inputClass =
  "focus-ring w-full rounded-control bg-fill px-3.5 py-2.5 text-[14px] outline-none placeholder:text-tertiary";

/** Widgets whose defaults are seeded from the location preference. */
const LOCATION_WIDGETS = ["system.weather", "system.astronomy"];

export default function StepPreferences({
  prefs,
  onChange,
  selected,
}: {
  prefs: Prefs;
  onChange: (patch: Partial<Prefs>) => void;
  selected: string[];
}) {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const needsLocation = selected.some((id) => LOCATION_WIDGETS.includes(id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight">A few details</h2>
        <p className="mt-1 text-[14px] text-secondary">
          These seed your widgets' settings. Change any of them later.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-secondary">
            Your name <span className="text-tertiary">(optional)</span>
          </span>
          <input
            type="text"
            className={inputClass}
            placeholder="Alex"
            value={prefs.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-secondary">Timezone</span>
          <input
            type="text"
            className={inputClass}
            placeholder={detected}
            value={prefs.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          />
          <span className="text-[11.5px] text-tertiary">Detected: {detected}</span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-secondary">Clock</span>
          <Segmented
            options={[
              { value: "12", label: "12-hour" },
              { value: "24", label: "24-hour" },
            ]}
            value={prefs.hour12 ? "12" : "24"}
            onChange={(v) => onChange({ hour12: v === "12" })}
            className="self-start"
          />
        </div>

        {needsLocation && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-secondary">City</span>
              <input
                type="text"
                className={inputClass}
                placeholder="San Francisco"
                value={prefs.weatherCity}
                onChange={(e) => onChange({ weatherCity: e.target.value })}
              />
              <span className="text-[11.5px] text-tertiary">
                Used for the forecast and for sunrise and sunset times.
              </span>
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-secondary">
                Temperature
              </span>
              <Segmented
                options={[
                  { value: "c", label: "Celsius" },
                  { value: "f", label: "Fahrenheit" },
                ]}
                value={prefs.units}
                onChange={(v) => onChange({ units: v })}
                className="self-start"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
