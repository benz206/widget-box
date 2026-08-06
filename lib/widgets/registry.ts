import type {
  ConfigField,
  WidgetCategory,
  WidgetDefinition,
  WidgetSize,
} from "./types";

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

export function getConfigFields(id: string): ConfigField[] {
  return registry.get(id)?.configFields ?? [];
}

export function getAccent(id: string): string {
  return registry.get(id)?.meta.accent ?? "#007aff";
}

export function getAllowedSizes(id: string): WidgetSize[] {
  return registry.get(id)?.meta.sizes ?? ["small", "medium", "large"];
}

/** Instance config merged over the widget's declared defaults. */
export function resolveConfig(
  id: string,
  config: Record<string, unknown>
): Record<string, unknown> {
  return { ...(registry.get(id)?.defaultConfig ?? {}), ...config };
}

export function listByCategory(): [WidgetCategory, WidgetDefinition[]][] {
  const order: WidgetCategory[] = [
    "productivity",
    "information",
    "finance",
    "lifestyle",
    "ambient",
    "fun",
  ];
  return order
    .map(
      (cat) =>
        [cat, listWidgets().filter((d) => d.meta.category === cat)] as [
          WidgetCategory,
          WidgetDefinition[]
        ]
    )
    .filter(([, defs]) => defs.length > 0);
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  productivity: "Productivity",
  information: "Information",
  lifestyle: "Lifestyle",
  finance: "Finance",
  fun: "Fun",
  ambient: "Ambient",
};
