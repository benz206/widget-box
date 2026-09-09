import { NextResponse } from "next/server";

export type BackdropPhoto = {
  id: string;
  url: string;
  alt: string;
  link: string;
};

// Stable landscape IDs keep the rotation calm and let the CDN cache each image.
const LANDSCAPES = [
  ["1018", "Green cliffs above a winding road"],
  ["1015", "A blue fjord between rocky mountains"],
  ["1016", "Warm evening light over a desert canyon"],
  ["1039", "A waterfall surrounded by forest"],
  ["1043", "A forest and river beneath granite cliffs"],
  ["10", "Evergreen forest beneath distant mountains"],
  ["11", "A winding stream through a misty valley"],
  ["12", "An open shoreline"],
  ["13", "Waves along the coast"],
  ["14", "A rocky coast and open water"],
  ["15", "A waterfall above a rocky stream"],
  ["16", "A peaceful view across the water"],
  ["17", "A path through the landscape"],
  ["18", "Sunlit grasses in a green meadow"],
  ["19", "Sunlight on a moss-covered tree"],
  ["28", "A quiet forest scene"],
  ["29", "Mountains beneath an open sky"],
  ["37", "A rugged coastal landscape"],
] as const;

export function GET() {
  const photos: BackdropPhoto[] = LANDSCAPES.map(([id, alt]) => ({
    id,
    url: `https://picsum.photos/id/${id}/2200/1400`,
    alt,
    link: `https://picsum.photos/images#${id}`,
  }));

  return NextResponse.json(photos, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=86400" },
  });
}
