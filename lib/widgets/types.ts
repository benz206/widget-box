// 3-tier sizing system for 5x5 grid (25 total cells)
export type WidgetSize = "small" | "medium" | "large";

// Grid dimensions for each size
export const WIDGET_SIZES = {
  small: { w: 1, h: 1 },   // 1x1 = 1 cell
  medium: { w: 2, h: 2 },  // 2x2 = 4 cells  
  large: { w: 3, h: 2 },   // 3x2 = 6 cells
} as const;

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


