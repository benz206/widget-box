"use client";

import Icon, { type IconName } from "@/app/components/ui/Icon";

const POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "weather",
    title: "Live, not pretend",
    body: "Real forecasts, real quotes, your device's real battery.",
  },
  {
    icon: "grid",
    title: "Arrange it your way",
    body: "Three sizes, dragged anywhere on the grid.",
  },
  {
    icon: "lock",
    title: "Stays on this device",
    body: "Your layout lives in this browser. No account needed.",
  },
];

export default function StepWelcome() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span
        className="mb-6 flex h-[68px] w-[68px] items-center justify-center rounded-[19px] text-white"
        style={{
          background: "linear-gradient(150deg, #0a84ff, #5e5ce6)",
          boxShadow: "0 10px 30px rgba(10,132,255,0.35)",
        }}
      >
        <Icon name="grid" size={32} strokeWidth={2} />
      </span>

      <h1 className="text-[30px] font-semibold tracking-tight">
        Welcome to Widget Box
      </h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-secondary">
        A dashboard of small, glanceable things. This takes about a minute.
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-2">
        {POINTS.map((point) => (
          <div
            key={point.title}
            className="flex items-start gap-3 rounded-card bg-fill px-4 py-3 text-left"
          >
            <span className="mt-0.5 shrink-0 text-accent">
              <Icon name={point.icon} size={17} strokeWidth={2} />
            </span>
            <div>
              <div className="text-[14px] font-medium">{point.title}</div>
              <div className="text-[12.5px] text-secondary">{point.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
