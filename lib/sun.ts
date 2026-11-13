const RAD = Math.PI / 180;

export const SUNRISE_ELEVATION = -0.833;
export const GOLDEN_HIGH = 6;
export const GOLDEN_LOW = -4;
export const BLUE_LOW = -6;

function solarTerms(ms: number): { declination: number; equationOfTime: number } {
  const t = (ms / 86_400_000 + 2440587.5 - 2451545) / 36525;
  const meanLong = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const anomaly = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const center =
    Math.sin(anomaly * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * anomaly * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * anomaly * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const apparentLong = meanLong + center - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const meanObliquity = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega * RAD);
  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(apparentLong * RAD));
  const y = Math.tan((obliquity / 2) * RAD) ** 2;
  const equationOfTime =
    (4 / RAD) *
    (y * Math.sin(2 * meanLong * RAD) -
      2 * eccentricity * Math.sin(anomaly * RAD) +
      4 * eccentricity * y * Math.sin(anomaly * RAD) * Math.cos(2 * meanLong * RAD) -
      0.5 * y * y * Math.sin(4 * meanLong * RAD) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * anomaly * RAD));
  return { declination, equationOfTime };
}

export function sunElevation(ms: number, lat: number, lon: number): number {
  const { declination, equationOfTime } = solarTerms(ms);
  const utcMinutes = (((ms / 60_000) % 1440) + 1440) % 1440;
  const solarMinutes = (utcMinutes + equationOfTime + 4 * lon) % 1440;
  const hourAngle = (solarMinutes / 4 - 180) * RAD;
  const cosZenith =
    Math.sin(lat * RAD) * Math.sin(declination) +
    Math.cos(lat * RAD) * Math.cos(declination) * Math.cos(hourAngle);
  return 90 - Math.acos(Math.min(1, Math.max(-1, cosZenith))) / RAD;
}

function solarNoon(dayStartUtc: number, lon: number): number {
  const guess = dayStartUtc + (720 - 4 * lon) * 60_000;
  return guess - solarTerms(guess).equationOfTime * 60_000;
}

function crossing(dayStartUtc: number, lat: number, lon: number, elevation: number, rising: boolean): number | null {
  const noon = solarNoon(dayStartUtc, lon);
  const { declination } = solarTerms(noon);
  const cosHourAngle =
    (Math.sin(elevation * RAD) - Math.sin(lat * RAD) * Math.sin(declination)) /
    (Math.cos(lat * RAD) * Math.cos(declination));
  if (Math.abs(cosHourAngle) > 1) return null;
  const offset = (Math.acos(cosHourAngle) / RAD) * 4 * 60_000;
  return rising ? noon - offset : noon + offset;
}

export type SunTimes = {
  noon: number;
  blueMorning: number | null;
  goldenMorning: number | null;
  sunrise: number | null;
  goldenMorningEnd: number | null;
  goldenEvening: number | null;
  sunset: number | null;
  goldenEveningEnd: number | null;
  blueEveningEnd: number | null;
};

export function sunTimes(dayStartUtc: number, lat: number, lon: number): SunTimes {
  const at = (elevation: number, rising: boolean) => crossing(dayStartUtc, lat, lon, elevation, rising);
  return {
    noon: solarNoon(dayStartUtc, lon),
    blueMorning: at(BLUE_LOW, true),
    goldenMorning: at(GOLDEN_LOW, true),
    sunrise: at(SUNRISE_ELEVATION, true),
    goldenMorningEnd: at(GOLDEN_HIGH, true),
    goldenEvening: at(GOLDEN_HIGH, false),
    sunset: at(SUNRISE_ELEVATION, false),
    goldenEveningEnd: at(GOLDEN_LOW, false),
    blueEveningEnd: at(BLUE_LOW, false),
  };
}
