"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Badge from "@/app/components/ui/Badge";
import Button from "@/app/components/ui/Button";
import ConfigForm from "@/app/components/ui/ConfigForm";
import Icon from "@/app/components/ui/Icon";
import Segmented from "@/app/components/ui/Segmented";
import TilePreview from "@/app/components/widgets/TilePreview";
import {
  createInstance,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  findFirstFit,
  type DashboardActions,
  type DashboardState,
} from "@/lib/storage/dashboard";
import { CATEGORY_LABELS, getWidgetById } from "@/lib/widgets/registry";
import { SIZE_LABELS, WIDGET_SIZES, type WidgetSize } from "@/lib/widgets/types";
import SizeChips from "./SizeChips";

export default function WidgetDetail({
  widgetId,
  state,
  actions,
  onClose,
}: {
  widgetId: string;
  state: DashboardState | null;
  actions: DashboardActions;
  onClose: () => void;
}) {
  const definition = getWidgetById(widgetId);
  const [size, setSize] = useState<WidgetSize>(
    definition?.meta.defaultSize ?? "small"
  );
  const [config, setConfig] = useState<Record<string, unknown>>(
    () => ({ ...(definition?.defaultConfig ?? {}) })
  );
  const [added, setAdded] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const cols = state?.preferences.gridCols ?? DEFAULT_COLS;
  const rows = state?.preferences.gridRows ?? DEFAULT_ROWS;
  const span = WIDGET_SIZES[size];
  const spot = findFirstFit(
    state?.instances.map((i) => i.position) ?? [],
    span.w,
    span.h,
    cols,
    rows
  );

  const add = useCallback(() => {
    if (!spot) return;
    actions.addInstance(createInstance(widgetId, { size, position: spot, config }));
    setAdded(true);
    setTimeout(onClose, 900);
  }, [spot, actions, widgetId, size, config, onClose]);

  if (!definition) return null;
  const { meta } = definition;
  const installed =
    state?.instances.filter((i) => i.widgetId === widgetId).length ?? 0;

  return (
    <div
      ref={backdropRef}
      onPointerDown={(e) => e.target === backdropRef.current && onClose()}
      className="drawer-scrim animate-fade-in"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-detail-title"
        className="drawer card"
        style={{ ["--tile-accent" as string]: meta.accent }}
      >
        <header className="drawer-header">
          <span className="icon-tile">
            <Icon name={meta.icon} size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="widget-detail-title" className="truncate">{meta.name}</h2>
            <p className="truncate">{meta.tagline}</p>
          </div>
          <Button variant="ghost" size="sm" iconOnly autoFocus onClick={onClose} aria-label="Close">
            <Icon name="xmark" size={14} />
          </Button>
        </header>

        <div className="drawer-body">
          <section>
            <div className="drawer-preview preview-surface">
              <TilePreview widgetId={widgetId} size={size} cell={124} config={config} />
            </div>
            {meta.sizes.length > 1 && (
              <Segmented
                options={meta.sizes.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
                value={size}
                onChange={setSize}
                className="mt-3 w-full"
              />
            )}
          </section>

          <p className="text-[13px] leading-relaxed text-secondary text-pretty">{meta.description}</p>

          <section>
            <h3 className="drawer-section-title">Details</h3>
            <dl className="detail-list">
              <div>
                <dt>Category</dt>
                <dd>{CATEGORY_LABELS[meta.category]}</dd>
              </div>
              <div>
                <dt>Sizes</dt>
                <dd>
                  <SizeChips sizes={meta.sizes} />
                </dd>
              </div>
              <div>
                <dt>On your dashboard</dt>
                <dd>
                  {installed > 0 ? (
                    <Badge tone="positive" dot>
                      {installed} added
                    </Badge>
                  ) : (
                    <Badge>Not added</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd className="flex flex-wrap justify-end gap-1">
                  {meta.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          {(definition.configFields?.length ?? 0) > 0 && (
            <section>
              <h3 className="drawer-section-title">Settings</h3>
              <ConfigForm
                fields={definition.configFields ?? []}
                config={config}
                onChange={(key, value) =>
                  setConfig((prev) => ({ ...prev, [key]: value }))
                }
              />
            </section>
          )}
        </div>

        <footer className="drawer-footer">
          {!spot && (
            <p className="callout mr-auto" data-tone="warning">
              <Icon name="alert" size={14} />
              No room at this size. Try a smaller one.
            </p>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={add} disabled={!spot || added}>
            <Icon name={added ? "check" : "plus"} size={14} />
            {added ? "Added" : installed > 0 ? "Add another" : "Add to dashboard"}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
