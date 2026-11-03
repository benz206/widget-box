import { describeWeather, type WeatherKind } from "@/lib/weather-codes";
import { cached } from "./cache";

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

export type WeatherResponse = {
  place: { name: string; region?: string; country?: string; timezone: string };
  current: {
    tempC: number;
    feelsLikeC: number;
    humidity: number;
    windKph: number;
    label: string;
    kind: WeatherKind;
    isDay: boolean;
  };
  today: { highC: number; lowC: number; sunrise: string; sunset: string };
  hourly: { time: string; tempC: number; kind: WeatherKind; isDay: boolean }[];
};

type Place = {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type Forecast = {
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[] };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
  };
};

/** Open-Meteo returns naive local ISO strings, so these compare lexically. */
function isDaytime(stamp: string, daily: Forecast["daily"]): boolean {
  const day = daily.time.findIndex((d) => stamp.startsWith(d));
  if (day < 0) return true;
  return stamp >= daily.sunrise[day] && stamp < daily.sunset[day];
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new Error("Weather service unavailable", { cause: error });
  }
  if (!res.ok) throw new Error("Weather service unavailable");
  return res.json();
}

function geocode(query: string, signal: AbortSignal): Promise<Place | null> {
  return cached(`geocode:${query.toLowerCase()}`, 86_400_000, async () => {
    const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const body = await getJson<{ results?: Place[] }>(url, signal);
    return body.results?.[0] ?? null;
  });
}

export async function fetchWeather(query: string, signal: AbortSignal): Promise<WeatherResponse> {
  const place = await geocode(query, signal);
  if (!place) throw new Error(`No place matched "${query}"`);

  return cached(`forecast:${place.latitude},${place.longitude}`, 900_000, async () => {
    const forecastUrl =
      `${FORECAST}?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
      `&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&forecast_days=2&timezone=auto`;
    const data = await getJson<Forecast>(forecastUrl, signal);

    const currentHour = data.current.time.slice(0, 13);
    const start = Math.max(
      0,
      data.hourly.time.findIndex((t) => t.slice(0, 13) >= currentHour)
    );

    return {
      place: {
        name: place.name,
        region: place.admin1,
        country: place.country,
        timezone: data.timezone,
      },
      current: {
        tempC: data.current.temperature_2m,
        feelsLikeC: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        windKph: data.current.wind_speed_10m,
        isDay: data.current.is_day === 1,
        ...describeWeather(data.current.weather_code),
      },
      today: {
        highC: data.daily.temperature_2m_max[0],
        lowC: data.daily.temperature_2m_min[0],
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0],
      },
      hourly: data.hourly.time.slice(start, start + 9).map((time, i) => ({
        time,
        tempC: data.hourly.temperature_2m[start + i],
        kind: describeWeather(data.hourly.weather_code[start + i]).kind,
        isDay: isDaytime(time, data.daily),
      })),
    };
  });
}
