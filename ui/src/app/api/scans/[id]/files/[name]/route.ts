import { readFile } from "node:fs/promises";
import path from "node:path";
import { scanDir } from "@/lib/store";


const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml" };

/** Serves the ad image and page capture of a scan. Only top-level image files; no path traversal. */
export async function GET(_req: Request, ctx: RouteContext<"/api/scans/[id]/files/[name]">) {
  const { id, name } = await ctx.params;
  const file = decodeURIComponent(name);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || file.includes("/") || file.includes("\\") || file.includes("..")) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(path.join(scanDir(id), file));
    // SVG uploads are user content: serve with a CSP that blocks scripts.
    return new Response(body, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
