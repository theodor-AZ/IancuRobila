import "server-only";
import { listScans, loadScan } from "./store";
import type { Scan } from "./types";

/** Real scans from the store (file store or Supabase). Demo data lives in src/mock and the template adapter. */
export async function getScan(id: string): Promise<Scan | null> {
  return loadScan(id).catch(() => null);
}

export async function getAllScans(): Promise<Scan[]> {
  return listScans();
}
