import { NextResponse } from "next/server";

const RANDOM = "https://api.unsplash.com/photos/random";
const UTM = "utm_source=widget_box&utm_medium=referral";

export type BackdropPhoto = {
  id: string;
  url: string;
  color: string;
  alt: string;
  author: { name: string; link: string };
  link: string;
};

type UnsplashPhoto = {
  id: string;
  color: string | null;
  alt_description: string | null;
  urls: { raw: string };
  links: { html: string };
  user: { name: string; links: { html: string } };
};

export async function GET() {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    return NextResponse.json({ error: "UNSPLASH_ACCESS_KEY is not set" }, { status: 503 });
  }

  try {
    const url = `${RANDOM}?query=nature%20landscape&orientation=landscape&content_filter=high&count=12`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`unsplash ${res.status}`);
    const data = (await res.json()) as UnsplashPhoto[];

    const photos: BackdropPhoto[] = data.map((p) => ({
      id: p.id,
      url: `${p.urls.raw}&w=2200&q=80&auto=format&fit=max`,
      color: p.color ?? "#808080",
      alt: p.alt_description ?? "",
      author: { name: p.user.name, link: `${p.user.links.html}?${UTM}` },
      link: `${p.links.html}?${UTM}`,
    }));

    return NextResponse.json(photos, {
      headers: { "Cache-Control": "public, max-age=900, s-maxage=3600" },
    });
  } catch (error) {
    console.error("backdrop lookup failed:", error);
    return NextResponse.json({ error: "Photo service unavailable" }, { status: 502 });
  }
}
