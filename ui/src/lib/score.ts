import type { Finding, Severity } from "./types";

/** Points removed per finding, scaled by confidence. 100 = nothing found. */
export const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 12, high: 6, medium: 3, low: 1 };

export function campaignScore(findings: Finding[]): number {
  const penalty = findings.reduce((s, f) => s + SEVERITY_WEIGHT[f.severity] * f.confidence, 0);
  return Math.max(0, Math.round(100 - penalty));
}

export type ScoreBand = "critical" | "at-risk" | "fair" | "good";

export function scoreBand(score: number): ScoreBand {
  if (score < 40) return "critical";
  if (score < 65) return "at-risk";
  if (score < 85) return "fair";
  return "good";
}

export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  critical: "Critical risk",
  "at-risk": "At risk",
  fair: "Fair",
  good: "Launch-ready",
};

export function countBySeverity(findings: Finding[]): Record<Severity, number> {
  const c = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) c[f.severity]++;
  return c;
}

const ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export function bySeverity(a: Finding, b: Finding): number {
  return ORDER[a.severity] - ORDER[b.severity] || b.confidence - a.confidence;
}
