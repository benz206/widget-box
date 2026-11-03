import { useEffect, useState } from "react";
import {
  BACKDROP_FREQUENCIES,
  BACKDROP_MOTIONS,
  refreshPhotos,
  showNextPhoto,
  useBackdropSettings,
  useQueuedPhotos,
} from "./Backdrop";
import Button from "./ui/Button";
import ConfigForm from "./ui/ConfigForm";
import Field from "./ui/Field";
import Icon from "./ui/Icon";
import Segmented from "./ui/Segmented";
import useDismiss from "./ui/useDismiss";
import { applyAppearance, readAppearance, type Appearance } from "./ui/appearance";
import { clearCache } from "@/lib/api/cache";
import { BACKDROP_TOPICS, CUSTOM_TOPIC, imageCacheStats, UNSPLASH_ENABLED } from "@/lib/api/unsplash";
import { useUsage } from "@/lib/api/usage";
import { DISPLAY_DEFAULTS, type DashboardPreferences } from "@/lib/storage/dashboard";
import type { ConfigField } from "@/lib/widgets/types";

const HEADER_FIELDS: ConfigField[] = [
  { kind: "text", key: "displayName", label: "Your name", placeholder: "Used in the greeting" },
  { kind: "toggle", key: "showGreeting", label: "Greeting" },
  { kind: "toggle", key: "showDate", label: "Date" },
  { kind: "toggle", key: "hour12", label: "12-hour clock" },
  { kind: "toggle", key: "showSeconds", label: "Seconds" },
  { kind: "toggle", key: "showSearch", label: "Search bar" },
];

const WIDGET_FIELDS: ConfigField[] = [
  { kind: "range", key: "tileOpacity", label: "Opacity", min: 0, max: 100, unit: "%", help: "Lower lets more of the photo through." },
  { kind: "range", key: "tileBlur", label: "Frost", min: 0, max: 48, unit: "px" },
];

const PHOTO_FIELDS: ConfigField[] = [
  { kind: "select", key: "topic", label: "Photos of", options: BACKDROP_TOPICS },
];

const BACKDROP_FIELDS: ConfigField[] = [
  { kind: "select", key: "frequency", label: "New photo", options: BACKDROP_FREQUENCIES },
  { kind: "select", key: "motion", label: "Motion", options: BACKDROP_MOTIONS },
  { kind: "range", key: "dim", label: "Dim", min: 0, max: 80, unit: "%" },
  { kind: "range", key: "blur", label: "Blur", min: 0, max: 24, unit: "px" },
];

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const number = new Intl.NumberFormat("en-US");

function minutesAgo(at: number) {
  const minutes = Math.round((Date.now() - at) / 60_000);
  return minutes < 1 ? "just now" : `${minutes} min ago`;
}

function CustomQuery({ value, onCommit }: { value: string; onCommit: (query: string) => void }) {
  const [draft, setDraft] = useState(value);
  const commit = () => draft.trim() !== value && onCommit(draft.trim());
  return (
    <Field label="Search Unsplash for" hint="Press Enter to apply. Each change fetches a fresh set of 30.">
      <input
        type="text"
        className="input"
        value={draft}
        placeholder="e.g. northern lights"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
    </Field>
  );
}

function UsageRow({ label, value, detail, share }: { label: string; value: string; detail: string; share?: number }) {
  return (
    <div className="usage-row">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="tabular text-[13px]">{value}</span>
      </div>
      {share !== undefined && (
        <div className="meter" aria-hidden>
          <span style={{ width: `${Math.max(0, Math.min(100, share * 100))}%` }} />
        </div>
      )}
      <p className="text-[12px] text-secondary">{detail}</p>
    </div>
  );
}

function UsagePanel() {
  const usage = useUsage();
  const queued = useQueuedPhotos();
  const [images, setImages] = useState<{ count: number; bytes: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    imageCacheStats().then((stats) => !cancelled && setImages(stats));
    return () => {
      cancelled = true;
    };
  }, [queued]);

  const limit = usage.unsplash;
  return (
    <div className="flex flex-col gap-3">
      {UNSPLASH_ENABLED && (
        <UsageRow
          label="Unsplash API"
          value={limit ? `${number.format(limit.remaining)} / ${number.format(limit.limit)}` : "—"}
          share={limit ? limit.remaining / limit.limit : undefined}
          detail={
            limit
              ? `Requests left this hour, as of ${minutesAgo(limit.at)}. ${number.format(usage.counts.unsplash ?? 0)} made today.`
              : "Shown after the first request."
          }
        />
      )}
      {UNSPLASH_ENABLED && (
        <UsageRow
          label="Photos"
          value={`${queued} queued`}
          detail={
            images
              ? `${images.count} cached on this device (${(images.bytes / 1_048_576).toFixed(1)} MB): the one on screen and the next ones up.`
              : "Counting cached photos…"
          }
        />
      )}
      <UsageRow
        label="Open-Meteo weather"
        value={`${number.format(usage.counts["open-meteo"] ?? 0)} today`}
        share={(usage.counts["open-meteo"] ?? 0) / 10_000}
        detail="Free tier allows 10,000 a day. Forecasts are reused for 15 minutes."
      />
      <UsageRow
        label="Yahoo Finance"
        value={`${number.format(usage.counts.yahoo ?? 0)} today`}
        detail="No published limit. Quotes are reused for a minute."
      />
    </div>
  );
}

export default function Settings({
  preferences,
  onChange,
  onRunSetup,
  onClose,
}: {
  preferences?: DashboardPreferences;
  onChange: (patch: Partial<DashboardPreferences>) => void;
  onRunSetup: () => void;
  onClose: () => void;
}) {
  const [backdrop, updateBackdrop] = useBackdropSettings();
  const [appearance, setAppearance] = useState(readAppearance);
  const [closing, dismiss] = useDismiss(onClose);
  const display = { ...DISPLAY_DEFAULTS, ...preferences };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  return (
    <div
      onPointerDown={(e) => e.target === e.currentTarget && dismiss()}
      className="drawer-scrim drawer-scrim--clear animate-fade-in"
      data-closing={closing || undefined}
    >
      <aside role="dialog" aria-modal="true" aria-labelledby="settings-title" className="drawer card">
        <header className="drawer-header">
          <span className="icon-tile">
            <Icon name="gear" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="settings-title">Settings</h2>
            <p>Changes apply as you make them</p>
          </div>
          <Button variant="ghost" size="sm" iconOnly autoFocus onClick={dismiss} aria-label="Close">
            <Icon name="xmark" size={14} />
          </Button>
        </header>

        <div className="drawer-body">
          <section>
            <h3 className="drawer-section-title">Clock and greeting</h3>
            <ConfigForm fields={HEADER_FIELDS} config={display} onChange={(key, value) => onChange({ [key]: value })} />
          </section>

          <section>
            <h3 className="drawer-section-title">Widgets</h3>
            <ConfigForm fields={WIDGET_FIELDS} config={display} onChange={(key, value) => onChange({ [key]: value })} />
          </section>

          <section>
            <h3 className="drawer-section-title">Background</h3>
            {UNSPLASH_ENABLED ? (
              <div className="flex flex-col gap-4">
                <ConfigForm fields={PHOTO_FIELDS} config={backdrop} onChange={(key, value) => updateBackdrop({ [key]: value })} />
                {backdrop.topic === CUSTOM_TOPIC && (
                  <CustomQuery value={backdrop.query} onCommit={(query) => updateBackdrop({ query })} />
                )}
                <ConfigForm fields={BACKDROP_FIELDS} config={backdrop} onChange={(key, value) => updateBackdrop({ [key]: value })} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={showNextPhoto}>
                    <Icon name="chevronRight" size={14} />
                    Next photo
                  </Button>
                  <Button onClick={refreshPhotos} title="Drop the queue and fetch a fresh set">
                    <Icon name="reset" size={14} />
                    Fetch new photos
                  </Button>
                </div>
              </div>
            ) : (
              <p className="callout" data-tone="warning">
                <Icon name="alert" size={14} />
                Photos are off. Add VITE_UNSPLASH_ACCESS_KEY to .env.local and rebuild.
              </p>
            )}
          </section>

          <section>
            <h3 className="drawer-section-title">Appearance</h3>
            <Segmented
              options={APPEARANCES}
              value={appearance}
              onChange={(next) => {
                setAppearance(next);
                applyAppearance(next);
              }}
              className="w-full"
            />
          </section>

          <section>
            <h3 className="drawer-section-title">Usage and limits</h3>
            <UsagePanel />
            <Button
              className="mt-4"
              onClick={() => {
                clearCache();
                location.reload();
              }}
            >
              <Icon name="reset" size={14} />
              Refresh widget data
            </Button>
          </section>

          <section>
            <h3 className="drawer-section-title">Dashboard</h3>
            <p className="mb-3 text-[13px] text-secondary text-pretty">
              Start again from a preset, with your name, timezone, and city.
            </p>
            <Button onClick={onRunSetup}>
              <Icon name="wand" size={14} />
              Run setup again
            </Button>
          </section>
        </div>
      </aside>
    </div>
  );
}
