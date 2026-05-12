import { WidgetDefinition } from "../types";

type StocksCfg = { symbols?: string[] };
type Ticker = { symbol: string; price: number; changePct: number; spark: number[] };
type StocksData = { tickers: Ticker[] };

const SEED: Record<string, { price: number; volatility: number }> = {
  AAPL: { price: 192.4, volatility: 1.8 },
  MSFT: { price: 421.2, volatility: 2.4 },
  NVDA: { price: 884.1, volatility: 8.2 },
  TSLA: { price: 178.9, volatility: 6.5 },
  GOOG: { price: 167.7, volatility: 2.1 },
  BTC: { price: 64210, volatility: 800 },
};

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const stocksWidget: WidgetDefinition<StocksCfg, StocksData> = {
  meta: {
    id: "system.stocks",
    slug: "stocks",
    name: "Stocks",
    provider: "system",
    creator: "widget-box",
    size: "medium",
    description: "Watchlist with sparklines",
    refreshIntervalSeconds: 60,
    category: "finance",
    tags: ["markets", "finance"],
    accent: "#a78bfa",
    allowedSizes: ["medium", "large"],
    summary: "Live tickers with sparkline charts",
  },
  defaultConfig: { symbols: ["AAPL", "NVDA", "TSLA", "BTC"] },
  configFields: [
    { kind: "list", key: "symbols", label: "Symbols (comma-separated)", placeholder: "AAPL, NVDA, TSLA" },
  ],
  async fetchData(cfg, ctx) {
    const symbols = cfg.symbols && cfg.symbols.length ? cfg.symbols : ["AAPL", "NVDA", "TSLA", "BTC"];
    const minutes = ctx.now.getHours() * 60 + ctx.now.getMinutes();
    const tickers: Ticker[] = symbols.map((sym) => {
      const seed = SEED[sym] ?? { price: 100, volatility: 2 };
      const spark = Array.from({ length: 16 }, (_, i) => {
        const r = pseudoRandom(sym.charCodeAt(0) + i + minutes / 30);
        return seed.price + (r - 0.5) * seed.volatility * 4;
      });
      const last = spark[spark.length - 1];
      const first = spark[0];
      const changePct = ((last - first) / first) * 100;
      return { symbol: sym, price: last, changePct, spark };
    });
    return { tickers };
  },
  toDisplay(d) {
    return d;
  },
};
