import { cached } from "./cache";
import { recordRequest } from "./usage";

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  currency: string;
  spark: number[];
};

export type MarketsResponse = { quotes: Quote[]; missing: string[] };

type Chart = {
  chart: {
    result?: {
      meta: {
        symbol: string;
        shortName?: string;
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
      indicators: { quote: { close?: (number | null)[] }[] };
    }[];
  };
};

async function loadQuote(symbol: string, signal: AbortSignal): Promise<Quote | null> {
  // Intraday where it exists; the wider window keeps a sparkline over
  // weekends and market holidays.
  for (const range of ["1d&interval=5m", "5d&interval=1h"]) {
    const res = await fetch(
      `${CHART}/${encodeURIComponent(symbol)}?range=${range}`,
      { headers: { Accept: "application/json" }, signal }
    );
    recordRequest("yahoo");
    if (!res.ok) continue;

    const result = ((await res.json()) as Chart).chart.result?.[0];
    const meta = result?.meta;
    if (!meta?.regularMarketPrice) continue;

    const closes = (result?.indicators.quote[0]?.close ?? []).filter(
      (v): v is number => typeof v === "number"
    );
    if (closes.length < 2 && range.startsWith("1d")) continue;

    const previous = meta.chartPreviousClose ?? meta.previousClose;
    return {
      symbol: meta.symbol,
      name: meta.shortName ?? meta.symbol,
      price: meta.regularMarketPrice,
      changePct: previous
        ? ((meta.regularMarketPrice - previous) / previous) * 100
        : 0,
      currency: meta.currency ?? "USD",
      spark: closes.slice(-40),
    };
  }
  return null;
}

export function fetchMarkets(symbols: string[], signal: AbortSignal): Promise<MarketsResponse> {
  return cached(`markets:${symbols.join(",")}`, 60_000, async () => {
    const settled = await Promise.all(
      symbols.map((symbol) =>
        loadQuote(symbol, signal).catch((error) => {
          if ((error as Error).name === "AbortError") throw error;
          console.error(`quote failed for ${symbol}:`, error);
          return null;
        })
      )
    );

    const body: MarketsResponse = {
      quotes: settled.filter((q): q is Quote => q !== null),
      missing: symbols.filter((_, i) => settled[i] === null),
    };
    if (body.quotes.length === 0) throw new Error("No quotes available");
    return body;
  });
}
