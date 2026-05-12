export type WidgetSize = "small" | "medium" | "large";

export type WidgetCategory =
  | "productivity"
  | "information"
  | "lifestyle"
  | "finance"
  | "fun"
  | "ambient";

export type ConfigField =
  | { kind: "text"; key: string; label: string; placeholder?: string; help?: string }
  | { kind: "toggle"; key: string; label: string; help?: string }
  | { kind: "list"; key: string; label: string; placeholder?: string; help?: string }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[]; placeholder?: string; help?: string }
  | { kind: "number"; key: string; label: string; placeholder?: string; min?: number; max?: number; help?: string };

export const WIDGET_SIZES = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 2 },
  large: { w: 3, h: 2 },
} as const;

export type WidgetMetadata = {
  id: string;
  slug: string;
  name: string;
  provider: string;
  creator?: string;
  size: WidgetSize;
  description?: string;
  refreshIntervalSeconds?: number;
  category?: WidgetCategory;
  tags?: string[];
  summary?: string;
  allowedSizes?: WidgetSize[];
  accent?: string;
};

export type WidgetContext = {
  now: Date;
  signal?: AbortSignal;
};

export type WidgetInstanceConfig = Record<string, unknown>;

export type WidgetData = unknown;

export type WidgetPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type UserWidgetConfig = {
  id: string;
  widgetId: string;
  position: WidgetPosition;
  config: WidgetInstanceConfig;
  data?: WidgetData;
  dataUpdatedAt?: Date;
  refreshIntervalSeconds?: number;
};

export interface WidgetDefinition<
  Cfg extends WidgetInstanceConfig = WidgetInstanceConfig,
  Data = WidgetData
> {
  meta: WidgetMetadata;
  defaultConfig?: Cfg;
  configFields?: ConfigField[];
  fetchData: (config: Cfg, ctx: WidgetContext) => Promise<Data>;
  computeSize?: (config: Cfg) => { w: number; h: number } | undefined;
  toDisplay?: (data: Data) => unknown;
}
