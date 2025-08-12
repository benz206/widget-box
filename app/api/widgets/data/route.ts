import { NextResponse } from "next/server";
import { getWidgetById } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";

registerSystemWidgets();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const cfgRaw = searchParams.get("cfg");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const def = getWidgetById(id);
  if (!def) {
    return NextResponse.json({ error: "Unknown widget" }, { status: 404 });
  }
  let cfg: Record<string, unknown> = {};
  if (cfgRaw) {
    try {
      cfg = JSON.parse(cfgRaw);
    } catch {
      return NextResponse.json({ error: "Invalid cfg" }, { status: 400 });
    }
  }
  const data = await def.fetchData(cfg, { now: new Date() });
  const display = def.toDisplay ? def.toDisplay(data as any) : (data as any);
  return NextResponse.json({ display });
}


