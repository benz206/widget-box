import type { ComponentType } from "react";
import type { IconName } from "@/app/components/ui/Icon";

export type WidgetSize = "small" | "medium" | "large";

export type WidgetCategory =
  | "productivity"
  | "information"
  | "lifestyle"
  | "finance"
  | "fun"
  | "ambient";

/**
 * Grid spans, proportioned like iOS home-screen widgets: a square, a wide
 * double, and a big square.
 */
export const WIDGET_SIZES: Record<WidgetSize, { w: number; h: number }> = {
  small: { w: 1, h: 1 },
  medium: { w: 2, h: 1 },
  large: { w: 2, h: 2 },
};

export const SIZE_LABELS: Record<WidgetSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export type ConfigField =
  | { kind: "text"; key: string; label: string; placeholder?: string; help?: string }
  | { kind: "toggle"; key: string; label: string; help?: string }
  | { kind: "list"; key: string; label: string; placeholder?: string; help?: string }
  | { kind: "date"; key: string; label: string; help?: string }
  | {
      kind: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
      help?: string;
    }
  | {
      kind: "number";
      key: string;
      label: string;
      placeholder?: string;
      min?: number;
      max?: number;
      help?: string;
    };

export type WidgetPosition = { x: number; y: number; w: number; h: number };

export type WidgetMetadata = {
  id: string;
  name: string;
  /** One line shown on marketplace cards. */
  tagline: string;
  description: string;
  category: WidgetCategory;
  icon: IconName;
  /** Tint used for the widget's icon and its data marks. Used sparingly. */
  accent: string;
  tags: string[];
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
};

export type WidgetViewProps = {
  instanceId: string;
  size: WidgetSize;
  /** Instance config already merged over the widget's defaults. */
  config: Record<string, unknown>;
};

export type WidgetDefinition = {
  meta: WidgetMetadata;
  defaultConfig?: Record<string, unknown>;
  configFields?: ConfigField[];
  View: ComponentType<WidgetViewProps>;
};
