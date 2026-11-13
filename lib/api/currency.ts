import { cached } from "./cache";

const RATES = "https://api.frankfurter.dev/v1";

export type Rate = { code: string; rate: number; changePct: number; spark: number[] };
export type RatesResponse = { base: string; date: string; rates: Rate[] };

type Series = { base: string; end_date: string; rates: Record<string, Record<string, number>> };

export function fetchRates(base: string, codes: string[], signal: AbortSignal): Promise<RatesResponse> {
  return cached(`fx:${base}:${codes.join(",")}`, 3_600_000, async () => {
    const start = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    let res: Response;
    try {
      res = await fetch(`${RATES}/${start}..?base=${base}&symbols=${codes.join(",")}`, { signal });
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      throw new Error("Exchange rates unavailable", { cause: error });
    }
    if (res.status === 404) throw new Error("Unknown currency code");
    if (!res.ok) throw new Error("Exchange rates unavailable");

    const body = (await res.json()) as Series;
    const days = Object.keys(body.rates).sort();
    return {
      base: body.base,
      date: body.end_date,
      rates: codes
        .map((code) => {
          const spark = days.map((d) => body.rates[d][code]).filter((v) => typeof v === "number");
          const first = spark[0];
          const rate = spark[spark.length - 1];
          return { code, rate, changePct: first ? ((rate - first) / first) * 100 : 0, spark };
        })
        .filter((r) => r.spark.length > 0),
    };
  });
}
