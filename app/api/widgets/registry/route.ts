import { NextResponse } from "next/server";
import { listWidgets } from "@/lib/widgets/registry";
import { registerSystemWidgets } from "@/lib/widgets/system";

// initialize registry (idempotent)
registerSystemWidgets();

export async function GET() {
  const widgets = listWidgets().map((w) => w.meta);
  return NextResponse.json({ widgets });
}


