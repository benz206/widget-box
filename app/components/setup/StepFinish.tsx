"use client";

type StepFinishProps = {
  presetName: string;
  widgetCount: number;
  displayName?: string;
  onFinish: () => void;
};

export default function StepFinish({ presetName, widgetCount, displayName, onFinish }: StepFinishProps) {
  const headline = displayName
    ? `Welcome aboard, ${displayName}`
    : "You're all set!";

  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div
        className="h-16 w-16 rounded-full border-2 border-emerald-400/60 flex items-center justify-center mb-6"
        style={{ boxShadow: "0 0 24px rgba(52,211,153,0.25)" }}
      >
        <span className="text-emerald-400 text-2xl">✓</span>
      </div>

      <h2 className="text-3xl font-bold tracking-tight text-white mb-3">{headline}</h2>

      <p className="text-white/60 text-base max-w-sm leading-relaxed mb-2">
        We've added{" "}
        <span className="text-white font-semibold">{widgetCount} widget{widgetCount !== 1 ? "s" : ""}</span>{" "}
        to your dashboard using the{" "}
        <span className="text-white/80">{presetName}</span> preset.
      </p>
      <p className="text-white/40 text-sm max-w-sm leading-relaxed mb-10">
        You can rearrange, customize, or add more anytime from the marketplace.
      </p>

      <button
        type="button"
        onClick={onFinish}
        className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
      >
        Open dashboard →
      </button>
    </div>
  );
}
