import { useEffect, useState } from "react";
import { WidgetHeader, WidgetMessage } from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#8e8e93";

type UserAgentData = {
  platform: string;
  getHighEntropyValues: (hints: string[]) => Promise<{
    platformVersion?: string;
    fullVersionList?: { brand: string; version: string }[];
  }>;
};

type Device = {
  chip: string;
  arch: string;
  cores: number;
  memoryGb: number;
  system: string | null;
  browser: string | null;
};

const hasSystemApi = () =>
  typeof chrome !== "undefined" && Boolean(chrome.system?.cpu && chrome.system?.memory);

function chipName(model: string): string {
  return model
    .replace(/\((R|TM)\)/g, "")
    .replace(/\s*CPU\s*@.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function browserName(brands: { brand: string; version: string }[]): string | null {
  const real = brands.filter((b) => !/not.?a.?brand/i.test(b.brand));
  const pick = real.find((b) => b.brand !== "Chromium") ?? real[0];
  return pick ? `${pick.brand.replace(/^Google /, "")} ${pick.version.split(".")[0]}` : null;
}

async function readDevice(): Promise<Device> {
  const ua = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  const [cpu, memory, hints] = await Promise.all([
    chrome.system.cpu.getInfo(),
    chrome.system.memory.getInfo(),
    ua?.getHighEntropyValues(["platformVersion", "fullVersionList"]).catch(() => null),
  ]);
  const version = hints?.platformVersion?.split(".").slice(0, 2).join(".");
  return {
    chip: chipName(cpu.modelName),
    arch: cpu.archName.replace("x86_64", "x86-64"),
    cores: cpu.numOfProcessors,
    memoryGb: Math.round(memory.capacity / 2 ** 30),
    system: ua ? [ua.platform, version].filter(Boolean).join(" ") : null,
    browser: hints?.fullVersionList ? browserName(hints.fullVersionList) : null,
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[11px]">
      <span className="shrink-0 text-tertiary">{label}</span>
      <span className="tabular truncate font-medium">{value}</span>
    </div>
  );
}

function DeviceView({ size }: WidgetViewProps) {
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (hasSystemApi()) readDevice().then(setDevice);
  }, []);

  const header = <WidgetHeader icon="laptop" label="This Device" accent={ACCENT} />;

  if (!hasSystemApi()) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>Load Widget Box as a Chrome extension to read device details.</WidgetMessage>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>Reading device…</WidgetMessage>
      </div>
    );
  }

  const display = `${screen.width * devicePixelRatio}×${screen.height * devicePixelRatio}`;

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        {header}
        <div className="text-[17px] font-semibold leading-tight">{device.chip}</div>
        <div className="tabular text-[11px] font-medium text-secondary">
          {device.cores} cores · {device.memoryGb} GB
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col justify-between gap-1.5">
      {header}
      <div className="flex flex-col gap-0.5">
        <Row label="Chip" value={`${device.chip} · ${device.cores} cores`} />
        <Row label="Memory" value={`${device.memoryGb} GB · ${device.arch}`} />
        {device.system && <Row label="System" value={device.system} />}
        {device.browser && <Row label="Browser" value={device.browser} />}
        <Row label="Display" value={`${display} @${devicePixelRatio}x`} />
      </div>
    </div>
  );
}

export const deviceWidget: WidgetDefinition = {
  meta: {
    id: "system.device",
    name: "This Device",
    tagline: "What you're running on.",
    description: "Your chip, core count, memory, operating system, browser version and display.",
    category: "information",
    icon: "laptop",
    accent: ACCENT,
    tags: ["system", "hardware"],
    sizes: ["small", "medium"],
    defaultSize: "medium",
  },
  View: DeviceView,
};
