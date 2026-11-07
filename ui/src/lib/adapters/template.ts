/**
 * Adapter între datele scannerului (src/lib/types.ts: Scan/Finding din pipeline și store)
 * și tipurile interfeței (src/types/finding.ts). Fără dependențe de server: rulează și în browser.
 */
import scansMock from "@/mock/scans.json";
import findingsMock from "@/mock/findings.json";
import type { Finding as UIFinding, FindingCategory, Scan as UIScan } from "@/types/finding";
import { campaignScore, countBySeverity } from "../score";
import type { Finding, Scan } from "../types";

/** Scanările demonstrative din template (mock/), marcate ca demo. */
export const DEMO_SCANS: UIScan[] = (scansMock as UIScan[]).map((s) => ({ ...s, isDemo: true }));
export const DEMO_FINDINGS = findingsMock as UIFinding[];

export function isDemoId(id: string) {
  return DEMO_SCANS.some((s) => s.id === id);
}

/** Categoria scannerului (+ ID-ul regulii) → categoria afișată în interfață. */
function toCategory(f: Finding): FindingCategory {
  const id = f.ruleId ?? "";
  if (f.category === "conversion") return "broken_conversion";
  if (f.category === "accessibility") return "accessibility";
  if (id.startsWith("PRICE-")) return "price_discrepancy";
  if (id === "MATERIAL-OMISSIONS" || id === "COS-CONDITIONS") return "hidden_terms";
  if (id.startsWith("REVIEWS-") || id.startsWith("SCARCITY-") || f.category === "trust") return "dark_pattern";
  if (f.category === "legal") return "regulatory_risk";
  return "unsubstantiated_claim";
}

const SOURCE_LABEL = { ad: "Reclamă", page: "Landing page", document: "Documente produs" } as const;
const clip = (s: string, n = 280) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function toUIFinding(f: Finding, scan: Scan): UIFinding {
  const technical = f.category === "conversion" || f.category === "accessibility";
  const src = f.evidence.source ?? "page";
  const context = [f.evidence.document && `Document: ${f.evidence.document}`, f.evidence.selector && `Element: ${f.evidence.selector}`]
    .filter(Boolean)
    .join(" · ");
  return {
    id: f.id,
    scanId: scan.id,
    title: f.title,
    category: toCategory(f),
    severity: f.severity,
    riskDescription: f.risk,
    regulatoryReference: f.rule ?? undefined,
    ruleId: f.ruleId,
    evidence: {
      // Verificările tehnice pornesc de la un element al paginii, nu de la o afirmație din reclamă.
      adText: clip(f.claim),
      adSource: technical ? "Element verificat pe landing page" : SOURCE_LABEL.ad,
      landingText: clip(f.evidence.snippet || f.claim, 600),
      landingUrl: f.evidence.url ?? scan.landingUrl,
      contextSnippet: context || (src === "document" ? SOURCE_LABEL.document : undefined),
      frames: f.evidence.frames?.filter((fr) => fr.target === "page").map(({ x, y, w, h }) => ({ x, y, w, h })),
    },
    aiSuggestedFix: {
      originalClaim: clip(f.claim),
      suggestedClaim: f.fix,
      rationale: f.risk,
    },
  };
}

const STATUS: Record<Scan["status"], UIScan["status"]> = {
  running: "in_progress",
  done: "completed",
  blocked: "failed",
  failed: "failed",
};

export function toUIScan(s: Scan): UIScan {
  return {
    id: s.id,
    // Reclama vine ca text + imagine încărcate, nu ca URL.
    adUrl: s.adImage ? "Text + imagine încărcate" : "Text încărcat",
    landingUrl: s.landingUrl,
    status: STATUS[s.status],
    score: s.status === "done" ? campaignScore(s.findings) : 0,
    createdAt: s.createdAt,
    findingsCount: countBySeverity(s.findings),
    campaign: [s.brand, s.campaign].filter(Boolean).join(" · "),
    pageCapture: s.pageCapture || undefined,
    adImage: s.adImage || undefined,
    documents: s.documents,
    warnings: s.warnings,
    error: s.error,
    step: s.step,
    isDemo: false,
  };
}

const ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

/** Scan + findings pentru raport, cu vulnerabilitățile ordonate după gravitate. */
export function toUIReport(s: Scan): { scan: UIScan; findings: UIFinding[] } {
  const findings = s.findings.map((f) => toUIFinding(f, s)).sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return { scan: toUIScan(s), findings };
}
