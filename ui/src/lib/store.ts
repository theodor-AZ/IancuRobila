import "server-only";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Scan } from "./types";

/**
 * File-based scan store for the sandbox: data/scans/<id>/scan.json plus uploaded and captured files.
 * Replace with Supabase (table + storage bucket) in the base; the function signatures stay the same.
 */
export const DATA_DIR = path.join(process.cwd(), "data", "scans");

export function scanDir(id: string) {
  if (!/^SCN-[A-Z0-9-]+$/.test(id)) throw new Error("Invalid scan id");
  return path.join(DATA_DIR, id);
}

export function newScanId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SCN-${t}-${r}`;
}

export async function saveScan(scan: Scan) {
  const dir = scanDir(scan.id);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, "scan.json.tmp");
  await writeFile(tmp, JSON.stringify(scan, null, 2));
  // rename is atomic on the same volume, so readers never see half a file
  await rename(tmp, path.join(dir, "scan.json"));
}

export async function updateScan(id: string, patch: Partial<Scan>) {
  const cur = await loadScan(id);
  if (!cur) return;
  await saveScan({ ...cur, ...patch });
}

export async function loadScan(id: string): Promise<Scan | null> {
  try {
    return JSON.parse(await readFile(path.join(scanDir(id), "scan.json"), "utf8")) as Scan;
  } catch {
    return null;
  }
}

export async function listScans(): Promise<Scan[]> {
  try {
    const ids = await readdir(DATA_DIR);
    const scans = await Promise.all(ids.map((id) => loadScan(id).catch(() => null)));
    return scans.filter((s): s is Scan => !!s);
  } catch {
    return [];
  }
}

/** URL under which a stored file is served by /api/scans/[id]/files/[name]. */
export function fileUrl(id: string, name: string) {
  return `/api/scans/${id}/files/${encodeURIComponent(name)}`;
}
