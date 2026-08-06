"use client";

import type { MarketsResponse } from "@/app/api/markets/route";
import {
  formatPrice,
  Sparkline,
  useRemote,
  WidgetHeader,
  WidgetMessage,
  WidgetSkeleton,
} from "@/app/components/widgets/kit";
import type { WidgetDefinition, WidgetViewProps } from "../types";

const ACCENT = "#5e5ce6";
const UP = "#30d158";
const DOWN = "#ff453a";
const REFRESH_MS = 60_000;

function symbolsOf(config: Record<string, unknown>): string[] {
  const raw = config.symbols;
  const list = Array.isArray(raw)
    ? raw.map(String)
    : String(raw ?? "").split(",");
  return list.map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 6);
}

function MarketsView({ size, config }: WidgetViewProps) {
  const symbols = symbolsOf(config);
  const { data, error, loading } = useRemote<MarketsResponse>(
    symbols.length ? `/api/markets?symbols=${symbols.join(",")}` : null,
    REFRESH_MS
  );

  if (!symbols.length) {
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="chart" label="Markets" accent={ACCENT} />
        <WidgetMessage>Add some symbols in this widget's settings.</WidgetMessage>
      </div>
    );
  }

  if (!data) {
    if (loading) return <WidgetSkeleton />;
    return (
      <div className="flex h-full w-full flex-col">
        <WidgetHeader icon="chart" label="Markets" accent={ACCENT} />
        <WidgetMessage>{error ?? "Quotes unavailable."}</WidgetMessage>
      </div>
    );
  }

  const rows = size === "small" ? 1 : size === "medium" ? 2 : 4;
  const quotes = data.quotes.slice(0, rows);

  if (size === "small" && quotes[0]) {
    const q = quotes[0];
    const up = q.changePct >= 0;
    return (
      <div className="flex h-full w-full flex-col justify-between">
        <WidgetHeader icon="chart" label={q.symbol} accent={ACCENT} />
        <div>
          <div className="tabular text-[1.7rem] font-light leading-none tracking-tight">
            {formatPrice(q.price)}
          </div>
          <div
            className="tabular mt-1 text-[12px] font-semibold"
            style={{ color: up ? UP : DOWN }}
          >
            {up ? "+" : ""}
            {q.changePct.toFixed(2)}%
          </div>
        </div>
        <Sparkline values={q.spark} color={up ? UP : DOWN} width={110} height={26} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <WidgetHeader icon="chart" label="Markets" accent={ACCENT} />
      <div className="flex flex-1 flex-col justify-around">
        {quotes.map((q) => {
          const up = q.changePct >= 0;
          return (
            <div key={q.symbol} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold leading-tight">
                  {q.symbol}
                </div>
                <div className="tabular truncate text-[11px] text-tertiary">
                  {formatPrice(q.price)} {q.currency}
                </div>
              </div>
              <Sparkline values={q.spark} color={up ? UP : DOWN} width={54} height={20} />
              <div
                className="tabular w-[58px] shrink-0 text-right text-[12px] font-semibold"
                style={{ color: up ? UP : DOWN }}
              >
                {up ? "+" : ""}
                {q.changePct.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
      {data.missing.length > 0 && (
        <div className="truncate text-[10px] text-tertiary">
          No data for {data.missing.join(", ")}
        </div>
      )}
    </div>
  );
}

export const marketsWidget: WidgetDefinition = {
  meta: {
    id: "system.stocks",
    name: "Markets",
    tagline: "Live prices for stocks, indexes, and crypto.",
    description:
      "Real quotes and intraday sparklines. Use any Yahoo Finance symbol — AAPL, ^GSPC, BTC-USD.",
    category: "finance",
    icon: "chart",
    accent: ACCENT,
    tags: ["stocks", "crypto", "markets"],
    sizes: ["small", "medium", "large"],
    defaultSize: "large",
  },
  defaultConfig: { symbols: ["AAPL", "NVDA", "BTC-USD", "^GSPC"] },
  configFields: [
    {
      kind: "list",
      key: "symbols",
      label: "Symbols",
      placeholder: "AAPL, NVDA, BTC-USD",
      help: "Up to six, comma separated",
    },
  ],
  View: MarketsView,
};
