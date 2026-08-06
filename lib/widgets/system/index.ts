import { registerWidget } from "../registry";
import { activityWidget } from "./activity";
import { batteryWidget } from "./battery";
import { calendarWidget } from "./calendar";
import { clockWidget } from "./clock";
import { countdownWidget } from "./countdown";
import { dailyNoteWidget } from "./dailynote";
import { marketsWidget } from "./markets";
import { moodWidget } from "./mood";
import { notesWidget } from "./notes";
import { petWidget } from "./pet";
import { pomodoroWidget } from "./pomodoro";
import { skyWidget } from "./sky";
import { weatherWidget } from "./weather";

const WIDGETS = [
  clockWidget,
  weatherWidget,
  calendarWidget,
  pomodoroWidget,
  notesWidget,
  countdownWidget,
  marketsWidget,
  batteryWidget,
  skyWidget,
  activityWidget,
  moodWidget,
  dailyNoteWidget,
  petWidget,
];

let registered = false;

export function registerSystemWidgets(): void {
  if (registered) return;
  registered = true;
  WIDGETS.forEach(registerWidget);
}

/** Ids of every built-in widget, for validating stored dashboards. */
export const SYSTEM_WIDGET_IDS: Set<string> = new Set(WIDGETS.map((w) => w.meta.id));
