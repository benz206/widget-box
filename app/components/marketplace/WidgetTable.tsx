"use client";

import Badge from "@/app/components/ui/Badge";
import Icon from "@/app/components/ui/Icon";
import { CATEGORY_LABELS } from "@/lib/widgets/registry";
import type { WidgetDefinition } from "@/lib/widgets/types";
import SizeChips from "./SizeChips";

export default function WidgetTable({
  definitions,
  installed,
  onSelect,
}: {
  definitions: WidgetDefinition[];
  installed: Map<string, number>;
  onSelect: (widgetId: string) => void;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Widget</th>
            <th className="hide-sm">Category</th>
            <th className="hide-sm">Sizes</th>
            <th>Status</th>
            <th aria-label="Open" />
          </tr>
        </thead>
        <tbody>
          {definitions.map(({ meta }) => {
            const count = installed.get(meta.id) ?? 0;
            return (
              <tr key={meta.id} onClick={() => onSelect(meta.id)}>
                <td>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="icon-tile" style={{ ["--tile-accent" as string]: meta.accent }}>
                      <Icon name={meta.icon} size={16} />
                    </span>
                    <div className="min-w-0">
                      <button
                        type="button"
                        className="table-link focus-ring"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(meta.id);
                        }}
                      >
                        {meta.name}
                      </button>
                      <p className="hide-sm truncate text-[12px] text-secondary">{meta.tagline}</p>
                    </div>
                  </div>
                </td>
                <td className="hide-sm text-secondary">{CATEGORY_LABELS[meta.category]}</td>
                <td className="hide-sm">
                  <SizeChips sizes={meta.sizes} />
                </td>
                <td>
                  {count > 0 ? (
                    <Badge tone="positive" dot>
                      {count} on dashboard
                    </Badge>
                  ) : (
                    <Badge>Not added</Badge>
                  )}
                </td>
                <td className="w-10 text-right text-tertiary">
                  <Icon name="chevronRight" size={16} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
