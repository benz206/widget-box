import React from "react";

/**
 * Stroke icons drawn on a 24px grid with a 1.75 stroke, matching the weight of
 * SF Symbols at text sizes. Everything inherits currentColor.
 */
const paths: Record<string, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  weather: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M8.5 2.2v1.3M8.5 12.5v1.3M2.7 8H4M13 8h1.3M4.4 3.9l.9.9M11.7 11.2l.9.9M12.6 3.9l-.9.9M5.3 11.2l-.9.9" />
      <path d="M17.2 20.5H9a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.5 1.2 3.4 3.4 0 0 1-1.9 6.8Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="4" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  battery: (
    <>
      <rect x="2" y="7" width="17" height="10" rx="3.2" />
      <path d="M21.5 10.5v3" />
    </>
  ),
  chart: (
    <>
      <path d="M3 16.5 8.5 11l3.5 3.5L21 6" />
      <path d="M21 11V6h-5" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 10v3.5M9.5 2.5h5M18.5 7.5l1.6-1.6" />
    </>
  ),
  note: (
    <>
      <path d="M5 3.5h9.5L19 8v12.5H5Z" />
      <path d="M14 3.5V8h5M8.5 12.5h7M8.5 16h4.5" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V3.8" />
      <path d="M5.5 4.5c4-1.8 8 1.8 12 0v8c-4 1.8-8-1.8-12 0Z" />
    </>
  ),
  rings: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.3" />
      <circle cx="12" cy="12" r="2.1" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  sparkles: (
    <>
      <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9Z" />
      <path d="M18.5 16.5l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6Z" />
    </>
  ),
  quote: (
    <>
      <path d="M9.5 6.5C6.9 7.6 5.5 9.8 5.5 13v4.5h5V12H8c0-1.7.6-2.9 2-3.6Z" />
      <path d="M18.5 6.5c-2.6 1.1-4 3.3-4 6.5v4.5h5V12H17c0-1.7.6-2.9 2-3.6Z" />
    </>
  ),
  pet: (
    <>
      <path d="M4.5 12.5c0-3.9 3.4-6.5 7.5-6.5s7.5 2.6 7.5 6.5c0 4.1-3 6.5-7.5 6.5s-7.5-2.4-7.5-6.5Z" />
      <path d="M5.6 7.6 4.2 4.4l3.3 1.3M18.4 7.6l1.4-3.2-3.3 1.3" />
      <path d="M9.5 12h.01M14.5 12h.01M10.5 15.2c1 .7 2 .7 3 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M6 12h12" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.6 14.3a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a1.9 1.9 0 1 1-3.8 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1A1.9 1.9 0 1 1 5 16.2l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.3a1.9 1.9 0 1 1 0-3.8H4a1.6 1.6 0 0 0 1.1-2.8L5 6.7A1.9 1.9 0 1 1 7.8 4l.1.1a1.6 1.6 0 0 0 1.8.3H9.8a1.6 1.6 0 0 0 1-1.5v-.3a1.9 1.9 0 1 1 3.8 0V2.7a1.6 1.6 0 0 0 2.7 1.1l.1-.1A1.9 1.9 0 1 1 20.1 6.5l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.3a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),
  xmark: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="M5 12.8 9.6 17 19 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.5a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5L17.5 7" />
    </>
  ),
  duplicate: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="3.2" />
      <path d="M15.5 5.5A3 3 0 0 0 12.7 3.5H6.5a3 3 0 0 0-3 3v6.2a3 3 0 0 0 2 2.8" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.5" />
      <path d="M3 9.5 4.8 4.2A1.6 1.6 0 0 1 6.3 3h11.4a1.6 1.6 0 0 1 1.5 1.2L21 9.5a3 3 0 0 1-5.6 1.6 3 3 0 0 1-5.4 0 3 3 0 0 1-5.6-1.6Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
    </>
  ),
  circleHalf: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </>
  ),
  play: <path d="M8 5.5 18 12 8 18.5Z" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  reset: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
      <path d="M4 4.5V10h5.5" />
    </>
  ),
  chevronLeft: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  chevronRight: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
  chevronDown: <path d="M5.5 9.5 12 16l6.5-6.5" />,
  person: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="3.2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  wand: (
    <>
      <path d="M4 20 15 9M13.5 4.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" />
      <path d="M19 13l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export default function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
