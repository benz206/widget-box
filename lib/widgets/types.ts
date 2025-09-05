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

// Widget position and size on the grid
export type WidgetPosition = {
  x: number; // column position (0-4)
  y: number; // row position (0-4)
  w: number; // width in grid cells (1-5)
  h: number; // height in grid cells (1-5)
};

// User's widget instance configuration
export type UserWidgetConfig = {
  id: string;
  widgetId: string;
  position: WidgetPosition;
  config: WidgetInstanceConfig;
  data?: WidgetData;
  dataUpdatedAt?: Date;
  refreshIntervalSeconds?: number;
};

export interface WidgetDefinition<Cfg extends WidgetInstanceConfig = WidgetInstanceConfig, Data = WidgetData> {
  meta: WidgetMetadata;
  // fetch data for rendering
  fetchData: (config: Cfg, ctx: WidgetContext) => Promise<Data>;
  // optional: compute custom sizes
  computeSize?: (config: Cfg) => { w: number; h: number } | undefined;
  // simple render server side to JSON serializable shape consumed by client components
  toDisplay?: (data: Data) => unknown;
}


