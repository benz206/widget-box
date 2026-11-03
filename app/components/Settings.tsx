import { useEffect, useState } from "react";
import { BACKDROP_FREQUENCIES, showNextPhoto, useBackdropSettings } from "./Backdrop";
import Button from "./ui/Button";
import ConfigForm from "./ui/ConfigForm";
import Icon from "./ui/Icon";
import Segmented from "./ui/Segmented";
import { applyAppearance, readAppearance, type Appearance } from "./ui/appearance";
import { BACKDROP_TOPICS, UNSPLASH_ENABLED } from "@/lib/api/unsplash";
import type { DashboardPreferences } from "@/lib/storage/dashboard";
import type { ConfigField } from "@/lib/widgets/types";

const PROFILE_FIELDS: ConfigField[] = [
  { kind: "text", key: "displayName", label: "Your name", placeholder: "Used in the greeting" },
  { kind: "toggle", key: "hour12", label: "12-hour clock" },
];

const BACKDROP_FIELDS: ConfigField[] = [
  { kind: "select", key: "topic", label: "Photos of", options: BACKDROP_TOPICS },
  { kind: "select", key: "frequency", label: "New photo", options: BACKDROP_FREQUENCIES },
];

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      className="drawer-scrim animate-fade-in"
    >
      <aside role="dialog" aria-modal="true" aria-labelledby="settings-title" className="drawer card">
        <header className="drawer-header">
          <span className="icon-tile">
            <Icon name="gear" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="settings-title">Settings</h2>
            <p>Saved in this browser</p>
          </div>
          <Button variant="ghost" size="sm" iconOnly autoFocus onClick={onClose} aria-label="Close">
            <Icon name="xmark" size={14} />
          </Button>
        </header>

        <div className="drawer-body">
          <section>
            <h3 className="drawer-section-title">Greeting</h3>
            <ConfigForm
              fields={PROFILE_FIELDS}
              config={{ hour12: true, ...preferences }}
              onChange={(key, value) => onChange({ [key]: value })}
            />
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
            <h3 className="drawer-section-title">Background</h3>
            {UNSPLASH_ENABLED ? (
              <div className="flex flex-col gap-4">
                <ConfigForm
                  fields={BACKDROP_FIELDS}
                  config={backdrop}
                  onChange={(key, value) => updateBackdrop({ [key]: value })}
                />
                <Button className="self-start" onClick={showNextPhoto}>
                  <Icon name="reset" size={14} />
                  Show another photo
                </Button>
              </div>
            ) : (
              <p className="callout" data-tone="warning">
                <Icon name="alert" size={14} />
                Photos are off. Add VITE_UNSPLASH_ACCESS_KEY to .env.local and rebuild.
              </p>
            )}
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
