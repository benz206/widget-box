import { registerWidget } from "../registry";
import { weatherWidget } from "./weather";
import { timeWidget } from "./time";

export function registerSystemWidgets(): void {
  registerWidget(weatherWidget);
  registerWidget(timeWidget);
}


