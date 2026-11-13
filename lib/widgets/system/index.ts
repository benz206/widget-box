import { registerWidget } from "../registry";
import { activityWidget } from "./activity";
import { airWidget } from "./air";
import { ambientWidget } from "./ambient";
import { batteryWidget } from "./battery";
import { breatheWidget } from "./breathe";
import { calendarWidget } from "./calendar";
import { clockWidget } from "./clock";
import { countdownWidget } from "./countdown";
import { currencyWidget } from "./currency";
import { dailyNoteWidget } from "./dailynote";
import { daylightWidget } from "./daylight";
import { decideWidget } from "./decide";
import { deviceWidget } from "./device";
import { marketsWidget } from "./markets";
import { monitorWidget } from "./monitor";
import { moodWidget } from "./mood";
import { networkWidget } from "./network";
import { notesWidget } from "./notes";
import { onThisDayWidget } from "./onthisday";
import { petWidget } from "./pet";
import { pomodoroWidget } from "./pomodoro";
import { skyWidget } from "./sky";
import { spotifyWidget } from "./spotify";
import { storageWidget } from "./storage";
import { tabsWidget } from "./tabs";
import { weatherWidget } from "./weather";
import { worldClockWidget } from "./worldclock";

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
  spotifyWidget,
  worldClockWidget,
  airWidget,
  onThisDayWidget,
  currencyWidget,
  ambientWidget,
  breatheWidget,
  decideWidget,
  monitorWidget,
  deviceWidget,
  networkWidget,
  storageWidget,
  tabsWidget,
  daylightWidget,
];

let registered = false;

export function registerSystemWidgets(): void {
  if (registered) return;
  registered = true;
  WIDGETS.forEach(registerWidget);
}

/** Ids of every built-in widget, for validating stored dashboards. */
export const SYSTEM_WIDGET_IDS: Set<string> = new Set(WIDGETS.map((w) => w.meta.id));
