"use client";

type PresetCardProps = {
  id: string;
  name: string;
  description: string;
  widgetIds: string[];
  accent: string;
  selected: boolean;
  onSelect: () => void;
};

export default function PresetCard({
  name,
  description,
  widgetIds,
  accent,
  selected,
  onSelect,
}: PresetCardProps) {
  const pills = widgetIds.length > 0 ? widgetIds : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative text-left rounded-2xl p-4 border transition-all duration-150",
        "bg-white/[0.05] hover:bg-white/[0.08]",
        selected
          ? "border-opacity-80 ring-1"
          : "border-white/10",
      ].join(" ")}
      style={
        selected
          ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}40` }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 mt-0.5"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
          />
          <span className="text-sm font-semibold text-white">{name}</span>
        </div>
        {selected && (
          <span
            className="text-xs font-bold shrink-0"
            style={{ color: accent }}
          >
            ✓
          </span>
        )}
      </div>

      <p className="text-xs text-white/50 mb-3 ml-4">{description}</p>

      {pills ? (
        <div className="flex flex-wrap gap-1.5 ml-4">
          {pills.map((id) => {
            const short = id.replace("system.", "");
            return (
              <span
                key={id}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/60 border border-white/10"
              >
                {short}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-white/40 ml-4 italic">Choose any combination</p>
      )}
    </button>
  );
}
