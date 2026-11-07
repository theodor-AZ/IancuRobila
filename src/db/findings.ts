/**
 * Convert between the shared Finding type (src/types.ts) and rows in the findings table.
 * The pipeline writes with findingToRow; the UI reads with rowToFinding, so components
 * keep receiving the exact Finding shape they were built against (mock/findings.json).
 */
import type { Evidence, Finding } from '../types.ts';
import type { Json, Tables, TablesInsert } from './database.types.ts';

export function findingToRow(f: Finding, scanId: string, source?: string): TablesInsert<'findings'> {
  return {
    scan_id: scanId,
    finding_key: f.id,
    source: source ?? null,
    category: f.category,
    severity: f.severity,
    title: f.title,
    claim: f.claim,
    evidence: f.evidence as unknown as Json,
    rule: f.rule,
    risk: f.risk,
    fix: f.fix,
    confidence: Math.round(Math.min(1, Math.max(0, f.confidence)) * 100) / 100,
  };
}

export function rowToFinding(r: Tables<'findings'>): Finding {
  return {
    id: r.finding_key,
    category: r.category,
    severity: r.severity,
    title: r.title,
    claim: r.claim,
    evidence: (r.evidence ?? {}) as unknown as Evidence,
    rule: r.rule,
    risk: r.risk,
    fix: r.fix,
    // numeric columns can come back as strings from PostgREST
    confidence: Number(r.confidence),
  };
}
