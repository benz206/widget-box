import { NextResponse } from "next/server";

const CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const MAX_SYMBOLS = 6;

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

async function loadQuote(symbol: string): Promise<Quote | null> {
  // Intraday where it exists; the wider window keeps a sparkline over
  // weekends and market holidays.
  for (const range of ["1d&interval=5m", "5d&interval=1h"]) {
    const res = await fetch(
      `${CHART}/${encodeURIComponent(symbol)}?range=${range}`,
      {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        next: { revalidate: 60 },
      }
    );
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

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, MAX_SYMBOLS);

  if (symbols.length === 0) {
    return NextResponse.json({ error: "Missing symbols" }, { status: 400 });
  }

  const settled = await Promise.all(
    symbols.map((symbol) =>
      loadQuote(symbol).catch((error) => {
        console.error(`quote failed for ${symbol}:`, error);
        return null;
      })
    )
  );

  const body: MarketsResponse = {
    quotes: settled.filter((q): q is Quote => q !== null),
    missing: symbols.filter((_, i) => settled[i] === null),
  };

  if (body.quotes.length === 0) {
    return NextResponse.json(
      { error: "No quotes available", ...body },
      { status: 502 }
    );
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60" },
  });
}
