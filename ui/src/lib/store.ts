import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { sbListScans, sbLoadScan, sbSaveScan, sbUpdateScan, supabaseConfigured } from "./store-supabase";
import type { Scan } from "./types";

/**
 * Scan store. Uses Supabase (Patrick's schema) when NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set in .env.local; otherwise a local file store:
 * data/scans/<id>/scan.json. Uploaded files and captures live in data/scans/<id>/ in both modes.
 */
export const DATA_DIR = path.join(process.cwd(), "data", "scans");
const useSupabase = supabaseConfigured();

export function scanDir(id: string) {
  if (!/^(SCN-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(id)) throw new Error("Invalid scan id");
  return path.join(DATA_DIR, id);
}

export function newScanId() {
  if (useSupabase) return randomUUID();
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SCN-${t}-${r}`;
}

/** Create a scan (first save). */
export async function saveScan(scan: Scan) {
  if (useSupabase) {
    await sbSaveScan(scan);
    return;
  }
  await fileSave(scan);
}

export async function updateScan(id: string, patch: Partial<Scan>) {
  if (useSupabase) return sbUpdateScan(id, patch);
  const cur = await loadScan(id);
  if (!cur) return;
  await fileSave({ ...cur, ...patch });
}

export async function loadScan(id: string): Promise<Scan | null> {
  if (useSupabase) return sbLoadScan(id).catch(() => null);
  try {
    return JSON.parse(await readFile(path.join(scanDir(id), "scan.json"), "utf8")) as Scan;
  } catch {
    return null;
  }
}

export async function listScans(): Promise<Scan[]> {
  if (useSupabase) return sbListScans().catch(() => []);
  try {
    const ids = await readdir(DATA_DIR);
    const scans = await Promise.all(ids.map((id) => loadScan(id).catch(() => null)));
    return scans.filter((s): s is Scan => !!s);
  } catch {
    return [];
  }
}

async function fileSave(scan: Scan) {
  const dir = scanDir(scan.id);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, "scan.json.tmp");
  await writeFile(tmp, JSON.stringify(scan, null, 2));
  // rename is atomic on the same volume, so readers never see half a file
  await rename(tmp, path.join(dir, "scan.json"));
}

/** URL under which a stored file is served by /api/scans/[id]/files/[name]. */
export function fileUrl(id: string, name: string) {
  return `/api/scans/${id}/files/${encodeURIComponent(name)}`;
}
