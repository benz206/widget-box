import { WidgetDefinition } from "../types";

type WeatherCfg = {
  city: string;
};

type WeatherData = {
  city: string;
  tempC: number;
  condition: string;
};

export const weatherWidget: WidgetDefinition<WeatherCfg, WeatherData> = {
  meta: {
    id: "system.weather.simple",
    slug: "weather.simple",
    name: "Weather",
    provider: "system",
    creator: "widget-box",
    size: "small",
    description: "Shows current temperature",
    refreshIntervalSeconds: 900,
  },
  async fetchData(config) {
    // Placeholder deterministic fake data for demo
    const cities = [
      { city: config.city || "San Francisco", tempC: 20, condition: "Sunny" },
      { city: "New York", tempC: 18, condition: "Cloudy" },
      { city: "London", tempC: 15, condition: "Rain" },
    ];
    const found = cities.find((c) => c.city.toLowerCase() === (config.city || "san francisco").toLowerCase());
    return found ?? cities[0];
  },
  toDisplay(data) {
    return data;
  },
};


