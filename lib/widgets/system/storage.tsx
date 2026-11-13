import { imageCacheStats } from "@/lib/api/unsplash";
import {
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#ac8e68";
const OTHER = "#64d2ff";
const REFRESH_MS = 5 * 60 * 1000;

type StorageReport = {
  usage: number;
  quota: number;
  photoBytes: number;
  photoCount: number;
};

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

async function readStorage(): Promise<StorageReport> {
  const [estimate, photos] = await Promise.all([navigator.storage.estimate(), imageCacheStats()]);
  const usage = estimate.usage ?? 0;
  return {
    usage: Math.max(usage, photos.bytes),
    quota: estimate.quota ?? 0,
    photoBytes: photos.bytes,
    photoCount: photos.count,
  };
}

function StorageView({ size }: WidgetViewProps) {
  const supported = typeof navigator.storage?.estimate === "function";
  const { data, error, loading } = useRemote<StorageReport>(
    supported ? "storage" : null,
    readStorage,
    REFRESH_MS
  );
  const header = <WidgetHeader icon="disk" label="Storage" accent={ACCENT} />;

  if (!supported || (!data && !loading)) {
    return (
      <div className="flex h-full w-full flex-col">
        {header}
        <WidgetMessage>{error ?? "This browser does not report storage use."}</WidgetMessage>
      </div>
    );
  }

  if (!data) return <WidgetSkeleton />;

  const total = (
    <div className="tabular text-[2rem] font-light leading-none tracking-tight">
      {formatBytes(data.usage)}
    </div>
  );
  const photos = `${data.photoCount} ${data.photoCount === 1 ? "photo" : "photos"} cached`;

  if (size === "small") {
    return (
      <div className="flex h-full w-full flex-col justify-between">
        {header}
        {total}
        <div>
          <div className="truncate text-[11px] font-medium text-secondary">{photos}</div>
          <div className="tabular truncate text-[11px] text-tertiary">
            of {formatBytes(data.quota)} allowed
          </div>
        </div>
      </div>
    );
  }

  const photoShare = data.usage > 0 ? data.photoBytes / data.usage : 0;
  const otherBytes = Math.max(0, data.usage - data.photoBytes);

  return (
    <div className="flex h-full w-full flex-col justify-between gap-2">
      {header}
      <div className="flex items-end justify-between gap-3">
        {total}
        <span className="tabular truncate text-[11px] text-tertiary">
          of {formatBytes(data.quota)} allowed
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex h-2 overflow-hidden rounded-full bg-fill">
          <div style={{ width: `${photoShare * 100}%`, background: ACCENT }} />
          <div style={{ width: `${(1 - photoShare) * 100}%`, background: OTHER }} />
        </div>
        <div className="tabular flex justify-between gap-2 text-[11px] font-medium text-secondary">
          <span className="flex items-center gap-1 truncate">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACCENT }} />
            {photos} · {formatBytes(data.photoBytes)}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: OTHER }} />
            Other · {formatBytes(otherBytes)}
          </span>
        </div>
      </div>
    </div>
  );
}

export const storageWidget: WidgetDefinition = {
  meta: {
    id: "system.storage",
    name: "Storage",
    tagline: "How much space Widget Box uses.",
    description:
      "Space used by cached photos and other data on this device, against the quota Chrome allows the extension.",
    category: "information",
    icon: "disk",
    accent: ACCENT,
    tags: ["system", "storage"],
    sizes: ["small", "medium"],
    defaultSize: "small",
  },
  View: StorageView,
};
