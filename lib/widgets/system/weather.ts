import { WidgetDefinition } from "../types";

type WeatherCfg = { city?: string; units?: "c" | "f" };
type WeatherData = {
  city: string;
  tempC: number;
  condition: string;
  high: number;
  low: number;
  icon: "sun" | "cloud" | "rain" | "snow" | "moon" | "cloud-sun" | "storm";
  hourly: { hour: string; tempC: number; icon: WeatherData["icon"] }[];
};

const CITIES: Omit<WeatherData, "hourly">[] = [
  { city: "San Francisco", tempC: 18, condition: "Sunny", high: 21, low: 14, icon: "sun" },
  { city: "New York", tempC: 12, condition: "Cloudy", high: 15, low: 8, icon: "cloud" },
  { city: "London", tempC: 9, condition: "Rain", high: 11, low: 6, icon: "rain" },
  { city: "Tokyo", tempC: 22, condition: "Clear", high: 25, low: 18, icon: "moon" },
  { city: "Paris", tempC: 14, condition: "Partly Cloudy", high: 17, low: 10, icon: "cloud-sun" },
  { city: "Reykjavik", tempC: -3, condition: "Snow", high: 0, low: -7, icon: "snow" },
  { city: "Singapore", tempC: 30, condition: "Thunderstorm", high: 32, low: 26, icon: "storm" },
];

export const weatherWidget: WidgetDefinition<WeatherCfg, WeatherData> = {
  meta: {
    id: "system.weather",
    slug: "weather",
    name: "Weather",
    provider: "system",
    creator: "widget-box",
    size: "medium",
    description: "Local conditions and forecast",
    refreshIntervalSeconds: 900,
    category: "information",
    tags: ["weather", "forecast"],
    accent: "#fb923c",
    summary: "Current conditions and a 6-hour forecast",
  },
  defaultConfig: { city: "San Francisco", units: "c" },
  configFields: [
    { kind: "text", key: "city", label: "City", placeholder: "San Francisco" },
    { kind: "select", key: "units", label: "Units", options: [{ value: "c", label: "Celsius" }, { value: "f", label: "Fahrenheit" }] },
  ],
  async fetchData(config, ctx) {
    const target = (config.city || "San Francisco").toLowerCase();
    const base = CITIES.find((c) => c.city.toLowerCase() === target) ?? CITIES[0];
    const hour = ctx.now.getHours();
    const hourly = Array.from({ length: 6 }, (_, i) => {
      const h = (hour + i) % 24;
      const drift = Math.sin((h / 24) * Math.PI * 2) * 3;
      const isNight = h < 6 || h >= 19;
      return {
        hour: i === 0 ? "Now" : `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`,
        tempC: Math.round(base.tempC + drift),
        icon: isNight ? ("moon" as const) : base.icon,
      };
    });
    return { ...base, hourly };
  },
  toDisplay(d) {
    return d;
  },
};
