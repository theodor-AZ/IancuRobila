import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { after, NextResponse } from "next/server";
import { runScan } from "@/lib/pipeline";
import { fileUrl, listScans, newScanId, saveScan, scanDir } from "@/lib/store";
import type { ProductCategory, Scan } from "@/lib/types";

export const maxDuration = 300;

const IMG_EXT: Record<string, string> = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/svg+xml": ".svg" };
const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document.pdf";

/** Start a scan. multipart/form-data: adText, landingUrl, productCategory, adImage?, documents[]? */
export async function POST(req: Request) {
  const form = await req.formData();
  const adText = String(form.get("adText") ?? "").trim();
  const landingUrl = String(form.get("landingUrl") ?? "").trim();
  const productCategory: ProductCategory = form.get("productCategory") === "cosmetics" ? "cosmetics" : "general";

  if (adText.length < 10) return NextResponse.json({ error: "Paste the ad copy (at least 10 characters)." }, { status: 400 });
  try {
    const u = new URL(landingUrl);
    if (!/^https?:$/.test(u.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Enter the full landing page address, starting with https://" }, { status: 400 });
  }

  const id = newScanId();
  const dir = scanDir(id);
  await mkdir(path.join(dir, "docs"), { recursive: true });

  let adImage = "";
  const img = form.get("adImage");
  if (img instanceof File && img.size > 0) {
    const ext = IMG_EXT[img.type];
    if (!ext) return NextResponse.json({ error: "Use a PNG, JPG, WebP or SVG image." }, { status: 400 });
    if (img.size > 10 * 1024 * 1024) return NextResponse.json({ error: "The image is larger than 10 MB." }, { status: 400 });
    await writeFile(path.join(dir, `creative${ext}`), Buffer.from(await img.arrayBuffer()));
    adImage = fileUrl(id, `creative${ext}`);
  }

  const documents: string[] = [];
  for (const d of form.getAll("documents")) {
    if (!(d instanceof File) || d.size === 0) continue;
    if (d.type !== "application/pdf") return NextResponse.json({ error: "Product documents must be PDF files." }, { status: 400 });
    const name = safeName(d.name);
    await writeFile(path.join(dir, "docs", name), Buffer.from(await d.arrayBuffer()));
    documents.push(name);
  }

  const host = new URL(landingUrl).hostname.replace(/^www\./, "");
  const scan: Scan = {
    id,
    campaign: String(form.get("campaign") ?? "").trim() || adText.split(/[.!\n]/)[0].slice(0, 60),
    brand: host,
    productCategory,
    landingUrl,
    adText,
    adImage,
    pageCapture: "",
    documents,
    createdAt: new Date().toISOString(),
    durationMs: 0,
    status: "running",
    step: 0,
    findings: [],
  };
  await saveScan(scan);

  after(() => runScan(id).catch((e) => console.error("scan failed", id, e)));
  return NextResponse.json({ id }, { status: 202 });
}

export async function GET() {
  return NextResponse.json(await listScans());
}
