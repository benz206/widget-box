import { registerWidget } from "../registry";
import { clockWidget } from "./clock";
import { weatherWidget } from "./weather";
import { calendarWidget } from "./calendar";
import { batteryWidget } from "./battery";
import { stocksWidget } from "./stocks";
import { musicWidget } from "./music";
import { fitnessWidget } from "./fitness";
import { pomodoroWidget } from "./pomodoro";
import { moodWidget } from "./mood";
import { affirmationWidget } from "./affirmation";
import { astronomyWidget } from "./astronomy";
import { pixelPetWidget } from "./pixelpet";

let registered = false;

export function registerSystemWidgets(): void {
  if (registered) return;
  registered = true;
  registerWidget(clockWidget);
  registerWidget(weatherWidget);
  registerWidget(stocksWidget);
  registerWidget(musicWidget);
  registerWidget(calendarWidget);
  registerWidget(batteryWidget);
  registerWidget(fitnessWidget);
  registerWidget(pomodoroWidget);
  registerWidget(moodWidget);
  registerWidget(affirmationWidget);
  registerWidget(astronomyWidget);
  registerWidget(pixelPetWidget);
}
