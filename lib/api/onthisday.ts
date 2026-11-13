import { cached } from "./cache";

const FEED = "https://en.wikipedia.org/api/rest_v1/feed/onthisday/selected";

export type HistoryEvent = { year: number; text: string; url: string | null; thumb: string | null };

type Feed = {
  selected?: {
    year: number;
    text: string;
    pages?: { content_urls?: { desktop?: { page?: string } }; thumbnail?: { source: string } }[];
  }[];
};

export function fetchOnThisDay(month: number, day: number, signal: AbortSignal): Promise<HistoryEvent[]> {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return cached(`onthisday:${mm}-${dd}`, 86_400_000, async () => {
    let res: Response;
    try {
      res = await fetch(`${FEED}/${mm}/${dd}`, { signal });
    } catch (error) {
      if ((error as Error).name === "AbortError") throw error;
      throw new Error("Wikipedia unavailable", { cause: error });
    }
    if (!res.ok) throw new Error("Wikipedia unavailable");
    const body = (await res.json()) as Feed;
    const events = (body.selected ?? []).map((e) => ({
      year: e.year,
      text: e.text,
      url: e.pages?.[0]?.content_urls?.desktop?.page ?? null,
      thumb: e.pages?.find((p) => p.thumbnail)?.thumbnail?.source ?? null,
    }));
    if (!events.length) throw new Error("Nothing listed for today");
    return events;
  });
}
