import { WidgetDefinition } from "./types";

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition): void {
  registry.set(def.meta.id, def);
}

export function getWidgetById(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function listWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}


