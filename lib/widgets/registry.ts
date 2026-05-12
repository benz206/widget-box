import { ConfigField, WidgetCategory, WidgetDefinition, WidgetInstanceConfig, WidgetSize } from "./types";

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

export function getConfigFields(id: string): ConfigField[] {
  return registry.get(id)?.configFields ?? [];
}

export function getAccent(id: string): string {
  return registry.get(id)?.meta.accent ?? "#60a5fa";
}

export function getAllowedSizes(id: string): WidgetSize[] {
  return registry.get(id)?.meta.allowedSizes ?? ["small", "medium", "large"];
}

export function listByCategory(): Record<WidgetCategory, WidgetDefinition<any, any>[]> {
  const result: Record<WidgetCategory, WidgetDefinition<any, any>[]> = {
    productivity: [],
    information: [],
    lifestyle: [],
    finance: [],
    fun: [],
    ambient: [],
  };
  for (const def of registry.values()) {
    const cat: WidgetCategory = def.meta.category ?? "information";
    result[cat].push(def);
  }
  return result;
}
