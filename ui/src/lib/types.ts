/**
 * Finding type (team brief, rule 3) plus the fields the UI needs for threat frames.
 * Provisional until the base posts the official type; keep field names identical.
 */

export type Category = "legal" | "truth" | "conversion" | "accessibility" | "trust";
export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
export const CATEGORIES: Category[] = ["legal", "truth", "conversion", "accessibility", "trust"];

/** A box drawn on a capture, in % of the image (0–100), so it scales with the image. */
export interface Frame {
  target: "ad" | "page";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Evidence {
  url?: string;
  screenshot?: string;
  snippet?: string;
  selector?: string;
  /** Where the evidence was found. */
  source?: "ad" | "page" | "document";
  /** Document name + page when source is "document". */
  document?: string;
  /** Threat frames for the evidence view. */
  frames?: Frame[];
  details?: Record<string, unknown>;
}

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  claim: string;
  evidence: Evidence;
  rule: string | null;
  risk: string;
  fix: string;
  confidence: number;
}

export type ProductCategory = "cosmetics" | "general";
export type ScanStatus = "running" | "done" | "blocked" | "failed";

export interface Scan {
  id: string;
  campaign: string;
  brand: string;
  productCategory: ProductCategory;
  landingUrl: string;
  adText: string;
  adImage: string;
  pageCapture: string;
  documents: string[];
  createdAt: string;
  durationMs: number;
  status: ScanStatus;
  findings: Finding[];
}
