/**
 * Convert between the app's Finding and rows in the findings table (Patrick's schema).
 * Adapted from src/db/findings.ts to the app types: the `rule` column stores the library /
 * technical rule id when there is one (e.g. "ENV-GENERIC", "WCAG-1.4.3"), as the schema comment says.
 */
import { ruleText } from "../rules/library";
import type { Evidence, Finding } from "../types";
import type { Json, Tables, TablesInsert } from "./database.types";

export function findingToRow(f: Finding, scanId: string, source?: string): TablesInsert<"findings"> {
  return {
    scan_id: scanId,
    finding_key: f.id,
    source: source ?? null,
    category: f.category,
    severity: f.severity,
    title: f.title,
    claim: f.claim,
    evidence: f.evidence as unknown as Json,
    rule: f.ruleId ?? f.rule,
    risk: f.risk,
    fix: f.fix,
    confidence: Math.round(Math.min(1, Math.max(0, f.confidence)) * 100) / 100,
  };
}

const RULE_ID = /^[A-Z][A-Z0-9]*(?:[-.][A-Z0-9]+)+$/;

export function rowToFinding(r: Tables<"findings">): Finding {
  const isId = !!r.rule && RULE_ID.test(r.rule);
  return {
    id: r.finding_key,
    category: r.category,
    severity: r.severity,
    title: r.title,
    claim: r.claim,
    evidence: (r.evidence ?? {}) as unknown as Evidence,
    rule: isId ? ruleText(r.rule!, r.rule!) : r.rule,
    ruleId: isId ? r.rule! : undefined,
    risk: r.risk,
    fix: r.fix,
    // numeric columns can come back as strings from PostgREST
    confidence: Number(r.confidence),
  };
}
