// Scanner result types. Findings use the app-wide Finding type.
export type { Category, Severity, Evidence, Finding } from "../types";
import type { Finding } from "../types";

/** Common result shape for every check module. */
export interface CheckResult<T = undefined> {
  url: string;
  ok: boolean;
  /** Set when the page could not be checked (blocked, timeout...). */
  error?: string;
  durationMs: number;
  findings: Finding[];
  data?: T;
}
