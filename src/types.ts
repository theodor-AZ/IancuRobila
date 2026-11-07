/**
 * PROVISIONAL Finding type, written from the team brief (rule 3).
 * The person building the base will post the official TypeScript type in the team group;
 * when it arrives, replace this file with it and fix any compile errors in src/checks/.
 */

export type Category = 'legal' | 'truth' | 'conversion' | 'accessibility' | 'trust';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/** What we found and where: URL, screenshot, document / HTML fragment. */
export interface Evidence {
  url?: string;
  /** Path to a screenshot file (relative to the fixture folder when saved by the CLI). */
  screenshot?: string;
  /** HTML or text fragment that shows the problem. */
  snippet?: string;
  /** CSS selector(s) of the affected element(s). */
  selector?: string;
  /** Free-form extra details (counts, measured values, contrast ratio...). */
  details?: Record<string, unknown>;
}

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  /** The targeted text (claim, button label, element). */
  claim: string;
  evidence: Evidence;
  /** Applicable rule, if any (e.g. "WCAG 2.1 SC 1.4.3"). */
  rule: string | null;
  risk: string;
  fix: string;
  /** 0–1 */
  confidence: number;
}

/** Common result shape for every module. */
export interface CheckResult<T = undefined> {
  url: string;
  ok: boolean;
  /** Set when the page could not be checked (blocked, timeout...). */
  error?: string;
  durationMs: number;
  findings: Finding[];
  data?: T;
}
