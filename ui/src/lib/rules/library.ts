/**
 * Colleague 4's legal rule library (role4/lib/rules/rules.json, copied as library.json).
 * Findings reference rules by id; the rule's legal reference and neutral risk wording are shown in the report.
 */
import library from "./library.json";

export interface LibraryRule {
  id: string;
  source: string;
  legalReference: string;
  explanation: string;
  triggerTerms: string[];
  riskyClaim: string;
  saferAlternative: string;
  riskWording: string;
  applicability: string;
}

export const RULES = library as LibraryRule[];
const BY_ID = new Map(RULES.map((r) => [r.id, r]));

export function getRule(id: string): LibraryRule | undefined {
  return BY_ID.get(id);
}

/** Display text for Finding.rule: "<legal reference> [ID]". */
export function ruleText(id: string, fallback: string): string {
  const r = BY_ID.get(id);
  return r ? `${r.legalReference} [${r.id}]` : fallback;
}
