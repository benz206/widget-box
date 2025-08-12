export type WidgetSize = "small" | "medium" | "large" | "wide" | "tall" | "custom";

export type WidgetMetadata = {
  id: string; // stable id key in registry
  slug: string; // canonical slug
  name: string;
  provider: string; // e.g., "system" or vendor
  creator?: string;
  size: WidgetSize;
  description?: string;
  refreshIntervalSeconds?: number; // default refresh
};

export type WidgetContext = {
  now: Date;
  signal?: AbortSignal;
};

export type WidgetInstanceConfig = Record<string, unknown>;

export type WidgetData = unknown;

export interface WidgetDefinition<Cfg extends WidgetInstanceConfig = WidgetInstanceConfig, Data = WidgetData> {
  meta: WidgetMetadata;
  // fetch data for rendering
  fetchData: (config: Cfg, ctx: WidgetContext) => Promise<Data>;
  // optional: compute custom sizes
  computeSize?: (config: Cfg) => { w: number; h: number } | undefined;
  // simple render server side to JSON serializable shape consumed by client components
  toDisplay?: (data: Data) => unknown;
}


