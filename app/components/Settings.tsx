import { useEffect, useState } from "react";
import {
  BACKDROP_CREDITS,
  BACKDROP_FREQUENCIES,
  BACKDROP_MOTIONS,
  refreshPhotos,
  showNextPhoto,
  toggleFavorite,
  useFavorites,
  useBackdropSettings,
  useQueuedPhotos,
} from "./Backdrop";
import Button from "./ui/Button";
import ConfigForm from "./ui/ConfigForm";
import Field from "./ui/Field";
import Icon, { type IconName } from "./ui/Icon";
import Segmented from "./ui/Segmented";
import useDismiss from "./ui/useDismiss";
import { applyAppearance, readAppearance, type Appearance } from "./ui/appearance";
import { clearCache } from "@/lib/api/cache";
import {
  connectSpotify,
  disconnectSpotify,
  SPOTIFY_CAN_CONNECT,
  SPOTIFY_ENABLED,
} from "@/lib/api/spotify";
import { apiKey, saveApiKey } from "@/lib/storage/keys";
import { useSpotifyConnected } from "@/lib/widgets/system/spotify";
import { BACKDROP_TOPICS, CUSTOM_TOPIC, FAVORITES_TOPIC, imageCacheStats, UNSPLASH_ENABLED } from "@/lib/api/unsplash";
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

const CORNER_FIELDS: ConfigField[] = [
  { kind: "range", key: "tileRadius", label: "Widgets and cards", min: 0, max: 32, unit: "px", help: "Also the now-playing card and photo credit." },
  { kind: "range", key: "searchRadius", label: "Search bar", min: 0, max: 24, unit: "px" },
];

const PHOTO_FIELDS: ConfigField[] = [
  { kind: "select", key: "topic", label: "Photos of", options: BACKDROP_TOPICS },
];

const BACKDROP_FIELDS: ConfigField[] = [
  { kind: "select", key: "frequency", label: "New photo", options: BACKDROP_FREQUENCIES },
  { kind: "select", key: "motion", label: "Motion", options: BACKDROP_MOTIONS },
  { kind: "range", key: "dim", label: "Dim", min: 0, max: 80, unit: "%" },
  { kind: "range", key: "blur", label: "Blur", min: 0, max: 24, unit: "px" },
  { kind: "select", key: "credit", label: "Photo credit", options: BACKDROP_CREDITS },
];

const NOW_PLAYING_FIELDS: ConfigField[] = [
  {
    kind: "select",
    key: "nowPlaying",
    label: "Show now playing",
    options: [
      { value: "corner", label: "As a card in the bottom-right corner" },
      { value: "widget", label: "Only in the Spotify widget" },
    ],
  },
];

const LAYOUTS: { value: NonNullable<DashboardPreferences["layout"]>; label: string }[] = [
  { value: "centered", label: "Centered" },
  { value: "left", label: "Left" },
  { value: "split", label: "Split" },
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

function KeyField({
  label,
  hint,
  value,
  onCommit,
}: {
  label: string;
  hint: React.ReactNode;
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const commit = () => draft.trim() !== value && onCommit(draft.trim());
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        className="input"
        value={draft}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
    </Field>
  );
}

function SpotifyConnection() {
  const connected = useSpotifyConnected();
  const [error, setError] = useState<string | null>(null);
  if (!SPOTIFY_ENABLED) return null;
  if (connected) {
    return (
      <Button className="self-start" onClick={disconnectSpotify}>
        <Icon name="logout" size={14} />
        Disconnect Spotify
      </Button>
    );
  }
  if (!SPOTIFY_CAN_CONNECT) return null;
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={() => {
          setError(null);
          connectSpotify().catch((err: Error) => setError(err.message));
        }}
      >
        <Icon name="music" size={14} />
        Connect Spotify
      </Button>
      {error && <p className="text-[12px] text-secondary">{error}</p>}
    </div>
  );
}

function thumbnail(raw: string) {
  const url = new URL(raw);
  url.searchParams.set("w", "320");
  url.searchParams.set("h", "200");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("q", "70");
  url.searchParams.set("fm", "avif");
  return url.toString();
}

function Favorites({ selected }: { selected: boolean }) {
  const favorites = useFavorites();
  return (
    <section>
      <h4 className="drawer-section-title">Favorites</h4>
      {favorites.length === 0 ? (
        <p className="text-[13px] text-secondary text-pretty">
          {selected ? "No favorites yet, so there is nothing to show. " : ""}
          Press the heart by the photo credit to save the photo on screen.
        </p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((photo) => (
            <div
              key={photo.id}
              className="favorite-thumb"
              title={`${photo.alt} by ${photo.author}`}
              style={{ backgroundImage: `url("${thumbnail(photo.raw)}")`, backgroundColor: photo.color }}
            >
              <button
                type="button"
                aria-label={`Remove photo by ${photo.author} from favorites`}
                onClick={() => toggleFavorite(photo)}
                className="focus-ring"
              >
                <Icon name="xmark" size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
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

type Tab = "general" | "widgets" | "background" | "spotify" | "usage";

const TABS: { id: Tab; label: string; icon: IconName; description: string }[] = [
  { id: "general", label: "General", icon: "clock", description: "The clock, greeting, and how the page looks." },
  { id: "widgets", label: "Widgets", icon: "grid", description: "How tiles sit on top of the photo." },
  { id: "background", label: "Background", icon: "photo", description: "Photos from Unsplash behind everything." },
  { id: "spotify", label: "Spotify", icon: "music", description: "Show what you're listening to." },
  { id: "usage", label: "Usage", icon: "chart", description: "Requests made to each service and their limits." },
];

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
  const [tab, setTab] = useState<Tab>("general");
  const [closing, dismiss] = useDismiss(onClose);
  const display = { ...DISPLAY_DEFAULTS, ...preferences };
  const current = TABS.find((t) => t.id === tab)!;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  return (
    <div
      onPointerDown={(e) => e.target === e.currentTarget && dismiss()}
      className="sheet-scrim"
      data-closing={closing || undefined}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="settings animate-sheet-in">
        <nav className="settings-nav" aria-label="Settings sections">
          <h2 id="settings-title">Settings</h2>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={t.id === tab ? "page" : undefined}
              onClick={() => setTab(t.id)}
              className="settings-nav-item focus-ring"
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="settings-pane">
          <header className="settings-pane-header">
            <div className="min-w-0 flex-1">
              <h3>{current.label}</h3>
              <p>{current.description}</p>
            </div>
            <Button variant="ghost" size="sm" iconOnly autoFocus onClick={dismiss} aria-label="Close">
              <Icon name="xmark" size={14} />
            </Button>
          </header>

          <div key={tab} className="settings-pane-body animate-fade-in">
            {tab === "general" && (
              <>
                <section>
                  <h4 className="drawer-section-title">Layout</h4>
                  <div role="radiogroup" aria-label="Layout" className="layout-picker">
                    {LAYOUTS.map((layout) => (
                      <button
                        key={layout.value}
                        type="button"
                        role="radio"
                        aria-checked={display.layout === layout.value}
                        onClick={() => onChange({ layout: layout.value })}
                        className="layout-option focus-ring"
                      >
                        <span className="layout-diagram" data-layout={layout.value} aria-hidden>
                          <span className="layout-diagram-intro">
                            <i />
                            <i />
                          </span>
                          <span className="layout-diagram-grid">
                            <i />
                            <i />
                            <i />
                          </span>
                        </span>
                        {layout.label}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <h4 className="drawer-section-title">Clock and greeting</h4>
                  <ConfigForm fields={HEADER_FIELDS} config={display} onChange={(key, value) => onChange({ [key]: value })} />
                </section>
                <section>
                  <h4 className="drawer-section-title">Appearance</h4>
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
                  <h4 className="drawer-section-title">Dashboard</h4>
                  <p className="mb-3 text-[13px] text-secondary text-pretty">
                    Start again from a preset, with your name, timezone, and city.
                  </p>
                  <Button onClick={onRunSetup}>
                    <Icon name="wand" size={14} />
                    Run setup again
                  </Button>
                </section>
              </>
            )}

            {tab === "widgets" && (
              <>
                <section>
                  <ConfigForm fields={WIDGET_FIELDS} config={display} onChange={(key, value) => onChange({ [key]: value })} />
                </section>
                <section>
                  <h4 className="drawer-section-title">Corner radius</h4>
                  <ConfigForm fields={CORNER_FIELDS} config={display} onChange={(key, value) => onChange({ [key]: value })} />
                </section>
              </>
            )}

            {tab === "background" && (
              <>
                <section>
                  <KeyField
                    label="Unsplash access key"
                    hint="From unsplash.com/developers. Saving reloads the page."
                    value={apiKey("unsplash") ?? ""}
                    onCommit={(value) => {
                      saveApiKey("unsplash", value);
                      location.reload();
                    }}
                  />
                </section>
                {UNSPLASH_ENABLED ? (
                  <>
                    <section className="flex flex-col gap-4">
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
                    </section>
                    <Favorites selected={backdrop.topic === FAVORITES_TOPIC} />
                  </>
                ) : (
                  <p className="callout" data-tone="warning">
                    <Icon name="alert" size={14} />
                    Photos are off until you add an access key.
                  </p>
                )}
              </>
            )}

            {tab === "spotify" && (
              <>
                <section className="flex flex-col gap-4">
                  <KeyField
                    label="Spotify client ID"
                    hint={
                      SPOTIFY_CAN_CONNECT ? (
                        <>
                          From developer.spotify.com. Add <code>{chrome.identity.getRedirectURL()}</code> as a
                          redirect URI. Saving reloads the page.
                        </>
                      ) : (
                        "From developer.spotify.com. Saving reloads the page."
                      )
                    }
                    value={apiKey("spotify") ?? ""}
                    onCommit={(value) => {
                      saveApiKey("spotify", value);
                      disconnectSpotify();
                      location.reload();
                    }}
                  />
                  <SpotifyConnection />
                </section>
                <section>
                  <ConfigForm fields={NOW_PLAYING_FIELDS} config={display} onChange={(key, value) => onChange({ [key]: value })} />
                </section>
              </>
            )}

            {tab === "usage" && (
              <section>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
