import Field from "@/app/components/ui/Field";
import Segmented from "@/app/components/ui/Segmented";

export type Prefs = {
  displayName: string;
  timezone: string;
  hour12: boolean;
  weatherCity: string;
  units: "c" | "f";
};

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
    <div>
      <h2 className="step-title">A few details</h2>
      <p className="step-description">
        These seed your widgets&apos; settings. Change any of them later.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <Field label={<>Your name <span className="font-normal text-secondary">(optional)</span></>}>
          <input
            type="text"
            className="input"
            placeholder="Alex"
            value={prefs.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </Field>

        <Field label="Timezone" hint={`Detected: ${detected}`}>
          <input
            type="text"
            className="input"
            placeholder={detected}
            value={prefs.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          />
        </Field>

        <Field label="Clock" group>
          <Segmented
            options={[
              { value: "12", label: "12-hour" },
              { value: "24", label: "24-hour" },
            ]}
            value={prefs.hour12 ? "12" : "24"}
            onChange={(v) => onChange({ hour12: v === "12" })}
            className="self-start"
          />
        </Field>

        {needsLocation && (
          <>
            <Field label="City" hint="Used for the forecast and for sunrise and sunset times.">
              <input
                type="text"
                className="input"
                placeholder="San Francisco"
                value={prefs.weatherCity}
                onChange={(e) => onChange({ weatherCity: e.target.value })}
              />
            </Field>

            <Field label="Temperature" group>
              <Segmented
                options={[
                  { value: "c", label: "Celsius" },
                  { value: "f", label: "Fahrenheit" },
                ]}
                value={prefs.units}
                onChange={(v) => onChange({ units: v })}
                className="self-start"
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}
