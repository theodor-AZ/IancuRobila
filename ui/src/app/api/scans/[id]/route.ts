import { NextResponse } from "next/server";
import { loadScan } from "@/lib/store";


export async function GET(_req: Request, ctx: RouteContext<"/api/scans/[id]">) {
  const { id } = await ctx.params;
  const scan = await loadScan(id).catch(() => null);
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  return NextResponse.json(scan, { headers: { "Cache-Control": "no-store" } });
}
