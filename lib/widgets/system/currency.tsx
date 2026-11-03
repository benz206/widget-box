import { fetchRates, type RatesResponse } from "@/lib/api/currency";
import {
  Sparkline,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#30d158";
const UP = "#30d158";
const DOWN = "#ff453a";
const REFRESH_MS = 60 * 60 * 1000;

function money(value: number, code: string): string {
  try {
    return value.toLocaleString("en-US", { style: "currency", currency: code });
  } catch {
    return `${value.toFixed(2)} ${code}`;
  }
}

function CurrencyView({ size, config }: WidgetViewProps) {
  const base = String(config.base || "USD").trim().toUpperCase();
  const codes = (Array.isArray(config.targets) ? config.targets.map(String) : [])
    .map((c) => c.trim().toUpperCase())
    .filter((c) => c && c !== base)
    .slice(0, 6);
  const rawAmount = Number(config.amount);
  const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 1;

  const { data, error, loading } = useRemote<RatesResponse>(
    codes.length ? `fx:${base}:${codes.join(",")}` : null,
    (signal) => fetchRates(base, codes, signal),
    REFRESH_MS
  );

  const title = `${amount.toLocaleString("en-US")} ${base}`;

  if (!codes.length) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="exchange" label="Currency" accent={ACCENT} />
        <WidgetMessage>Add currencies in settings.</WidgetMessage>
      </div>
    );
  }

  if (!data) {
    if (loading) return <WidgetSkeleton />;
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="exchange" label={title} accent={ACCENT} />
        <WidgetMessage>{error ?? "Exchange rates unavailable."}</WidgetMessage>
      </div>
    );
  }

  const asOf = new Date(`${data.date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (size === "small" && data.rates[0]) {
    const r = data.rates[0];
    const up = r.changePct >= 0;
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="exchange" label={`${title} →`} accent={ACCENT} />
        <div>
          <div className="tabular truncate text-[1.5rem] font-light leading-none tracking-tight">
            {money(amount * r.rate, r.code)}
          </div>
          <div className="tabular mt-1 text-[12px] font-semibold" style={{ color: up ? UP : DOWN }}>
            {up ? "+" : ""}
            {r.changePct.toFixed(2)}% · 30d
          </div>
        </div>
        <Sparkline values={r.spark} color={up ? UP : DOWN} width={110} height={24} />
      </div>
    );
  }

  const rows = data.rates.slice(0, size === "medium" ? 3 : 6);

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <WidgetHeader icon="exchange" label={title} accent={ACCENT} />
      <div className="flex min-h-0 flex-1 flex-col justify-around">
        {rows.map((r) => {
          const up = r.changePct >= 0;
          return (
            <div key={r.code} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-[12px] font-semibold text-secondary">{r.code}</span>
              <span className="tabular min-w-0 flex-1 truncate text-[14px] font-medium">
                {money(amount * r.rate, r.code)}
              </span>
              <Sparkline values={r.spark} color={up ? UP : DOWN} width={48} height={18} />
              <span
                className="tabular w-[52px] shrink-0 text-right text-[11px] font-semibold"
                style={{ color: up ? UP : DOWN }}
              >
                {up ? "+" : ""}
                {r.changePct.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      {size === "large" && (
        <div className="truncate text-[10px] text-tertiary">
          ECB reference rates, {asOf} · change over 30 days
        </div>
      )}
    </div>
  );
}

export const currencyWidget: WidgetDefinition = {
  meta: {
    id: "system.currency",
    name: "Currency",
    tagline: "What your money is worth elsewhere.",
    description:
      "Converts an amount into other currencies at the European Central Bank's daily reference rates, with a 30-day trend.",
    category: "finance",
    icon: "exchange",
    accent: ACCENT,
    tags: ["currency", "exchange", "travel"],
    sizes: ["small", "medium", "large"],
    defaultSize: "medium",
  },
  defaultConfig: { base: "USD", amount: 1, targets: ["EUR", "GBP", "JPY"] },
  configFields: [
    { kind: "text", key: "base", label: "From", placeholder: "USD" },
    { kind: "number", key: "amount", label: "Amount", min: 0 },
    {
      kind: "list",
      key: "targets",
      label: "To",
      placeholder: "EUR, GBP, JPY",
      help: "Up to six of the roughly 30 currencies the ECB publishes",
    },
  ],
  View: CurrencyView,
};
