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
    <div>
      <h1 className="step-title">Welcome to Widget Box</h1>
      <p className="step-description">
        A dashboard of small, glanceable things. This takes about a minute.
      </p>

      <ul className="card mt-6 divide-y divide-separator">
        {POINTS.map((point) => (
          <li key={point.title} className="flex items-start gap-3 p-4">
            <span className="icon-tile">
              <Icon name={point.icon} size={16} />
            </span>
            <div>
              <div className="text-[13px] font-semibold">{point.title}</div>
              <div className="mt-0.5 text-[13px] text-secondary">{point.body}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
