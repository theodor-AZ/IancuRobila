/**
 * Adapter between the app's Scan/Finding (scanner + store) and Colleague 1's ScanSummary/Finding
 * (src/types/finding.ts), so his screens can show real scan results.
 */
import findingsJson from "@/mock/coleg1/findings.json";
import scansJson from "@/mock/coleg1/scans.json";
import type { Finding as C1Finding, ScanSummary } from "@/types/finding";
import { campaignScore } from "../score";
import type { Finding, Scan } from "../types";

const SOURCE_LABEL = { ad: "Ad", page: "Landing page", document: "Product documents" } as const;

export function toC1Finding(f: Finding): C1Finding {
  const src = f.evidence.source ?? "page";
  return {
    id: f.id,
    category: f.category,
    severity: f.severity,
    title: f.title,
    claim: f.claim,
    evidence: {
      source: f.evidence.document ?? (f.evidence.url ? `${SOURCE_LABEL[src]} · ${f.evidence.url}` : SOURCE_LABEL[src]),
      snippet: f.evidence.snippet ?? "",
      location: f.evidence.selector,
    },
    rule: f.rule ?? undefined,
    risk: f.risk,
    fix: f.fix,
    confidence: f.confidence,
  };
}

export function toScanSummary(s: Scan): ScanSummary {
  return {
    id: s.id,
    campaignName: `${s.brand} ${s.campaign}`.trim(),
    brand: s.brand,
    productCategory: s.productCategory,
    landingPageUrl: s.landingUrl,
    adText: s.adText,
    adImageUrl: s.adImage,
    documents: s.documents,
    createdAt: s.createdAt,
    score: campaignScore(s.findings),
    findings: s.findings.map(toC1Finding),
  };
}

type C1MockScan = Omit<ScanSummary, "findings"> & { findingIds: string[] };

/** Colleague 1's own demo scans, with findings resolved from findingIds. */
export const COLEG1_MOCK_SCANS: ScanSummary[] = (scansJson as C1MockScan[]).map(({ findingIds, ...s }) => ({
  ...s,
  findings: (findingsJson as C1Finding[]).filter((f) => findingIds.includes(f.id)),
}));
