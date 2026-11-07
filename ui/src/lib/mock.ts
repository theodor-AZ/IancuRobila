import scansJson from "@/mock/scans.json";
import type { Scan } from "./types";

export const MOCK_SCANS = scansJson as Scan[];

export function getMockScan(id: string): Scan | undefined {
  return MOCK_SCANS.find((s) => s.id === id);
}
