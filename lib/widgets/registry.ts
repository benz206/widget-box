import { WidgetDefinition, WidgetInstanceConfig } from "./types";

// Use generic-erased storage to allow widgets with specific configs/data
const registry = new Map<string, WidgetDefinition<any, any>>();

export function registerWidget<Cfg extends WidgetInstanceConfig, Data>(def: WidgetDefinition<Cfg, Data>): void {
  registry.set(def.meta.id, def as unknown as WidgetDefinition<any, any>);
}

export function getWidgetById(id: string): WidgetDefinition<any, any> | undefined {
  return registry.get(id);
}

export function listWidgets(): WidgetDefinition<any, any>[] {
  return Array.from(registry.values());
}


