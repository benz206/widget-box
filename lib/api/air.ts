import { cached } from "./cache";
import { recordRequest } from "./usage";
import { geocode } from "./weather";

const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";

export type AirResponse = {
  place: string;
  aqi: number;
  pm25: number | null;
  pm10: number | null;
  uv: number | null;
  hourly: number[];
};

type Body = {
  current: { time: string; us_aqi: number | null; pm2_5: number | null; pm10: number | null; uv_index: number | null };
  hourly: { time: string[]; us_aqi: (number | null)[] };
};

export async function fetchAir(query: string, signal: AbortSignal): Promise<AirResponse> {
  const place = await geocode(query, signal);
  if (!place) throw new Error(`No place matched "${query}"`);

  return cached(`air:${place.latitude},${place.longitude}`, 1_800_000, async () => {
    const url =
      `${AIR}?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=us_aqi,pm2_5,pm10,uv_index&hourly=us_aqi&forecast_days=2&timezone=auto`;
    let res: Response;
    try {
      res = await fetch(url, { signal });
      recordRequest("open-meteo");
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      throw new Error("Air quality unavailable", { cause: error });
    }
    if (!res.ok) throw new Error("Air quality unavailable");

    const { current, hourly } = (await res.json()) as Body;
    if (current.us_aqi === null) throw new Error(`No air data for ${place.name}`);
    const start = Math.max(0, hourly.time.indexOf(current.time));
    return {
      place: place.name,
      aqi: current.us_aqi,
      pm25: current.pm2_5,
      pm10: current.pm10,
      uv: current.uv_index,
      hourly: hourly.us_aqi.slice(start, start + 12).filter((v): v is number => v !== null),
    };
  });
}
