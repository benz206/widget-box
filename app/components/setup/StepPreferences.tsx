"use client";

export type Prefs = {
  displayName: string;
  timezone: string;
  hour12: boolean;
  defaultCity: string;
  units: "c" | "f";
};

type StepPreferencesProps = {
  prefs: Prefs;
  onChange: (patch: Partial<Prefs>) => void;
  selectedWidgetIds: string[];
};

const inputCls =
  "w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-blue-400/60 focus:border-blue-400/60 transition-colors";

const segmentBase =
  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer";
const segmentActive = "bg-white/20 text-white";
const segmentInactive = "text-white/40 hover:text-white/70";

const hasWeather = (ids: string[]) => ids.includes("system.weather");

export default function StepPreferences({ prefs, onChange, selectedWidgetIds }: StepPreferencesProps) {
  const weatherVisible = hasWeather(selectedWidgetIds);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">A few preferences</h2>
        <p className="text-white/50 text-sm">Personalize your experience. Everything can be changed later.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Display name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">
            Display name <span className="text-white/30 normal-case">(optional)</span>
          </label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Alex"
            value={prefs.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Timezone</label>
          <input
            type="text"
            className={inputCls}
            placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone}
            value={prefs.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          />
          <p className="text-[10px] text-white/30">
            Detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </p>
        </div>

        {/* Hour format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Hour format</label>
          <div className="inline-flex items-center rounded-lg bg-white/[0.06] border border-white/10 p-1 gap-0.5 self-start">
            {([true, false] as const).map((h12) => (
              <button
                key={String(h12)}
                type="button"
                onClick={() => onChange({ hour12: h12 })}
                className={[segmentBase, prefs.hour12 === h12 ? segmentActive : segmentInactive].join(" ")}
              >
                {h12 ? "12-hour" : "24-hour"}
              </button>
            ))}
          </div>
        </div>

        {/* Weather fields — conditional */}
        {weatherVisible && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Default city for weather</label>
              <input
                type="text"
                className={inputCls}
                placeholder="San Francisco"
                value={prefs.defaultCity}
                onChange={(e) => onChange({ defaultCity: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Temperature units</label>
              <div className="inline-flex items-center rounded-lg bg-white/[0.06] border border-white/10 p-1 gap-0.5 self-start">
                {(["c", "f"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => onChange({ units: unit })}
                    className={[segmentBase, prefs.units === unit ? segmentActive : segmentInactive].join(" ")}
                  >
                    {unit === "c" ? "°C" : "°F"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
