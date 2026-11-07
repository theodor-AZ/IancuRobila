import "server-only";
import { MOCK_SCANS, getMockScan } from "./mock";
import { listScans, loadScan } from "./store";
import type { Scan } from "./types";

/** Real scans from the store first, then the mock demo scans. */
export async function getScan(id: string): Promise<Scan | null> {
  return (await loadScan(id).catch(() => null)) ?? getMockScan(id) ?? null;
}

export async function getAllScans(): Promise<Scan[]> {
  const real = await listScans();
  return [...real, ...MOCK_SCANS];
}
