const SYNODIC_DAYS = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC. */
const REFERENCE = Date.UTC(2000, 0, 6, 18, 14);

const PHASE_NAMES = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent",
];

/** Position in the synodic cycle: 0 new, 0.25 first quarter, 0.5 full. */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - REFERENCE) / 86_400_000;
  return (((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS) / SYNODIC_DAYS;
}

export function moonPhaseName(phase: number): string {
  return PHASE_NAMES[Math.round(phase * 8) % 8];
}

/** Fraction of the disc lit, as a percentage. */
export function moonIllumination(phase: number): number {
  return Math.round((1 - Math.cos(phase * Math.PI * 2)) * 50);
}
