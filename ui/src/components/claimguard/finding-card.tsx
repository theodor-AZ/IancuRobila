"use client";

import { useState } from "react";
import { Check, Copy, FileText, Globe, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/category-icon";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { FrameNumber } from "@/components/ui/threat-frame";
import { cn } from "@/lib/utils";
import type { Finding } from "@/lib/types";

const SOURCE = {
  ad: { icon: Megaphone, label: "Ad" },
  page: { icon: Globe, label: "Landing page" },
  document: { icon: FileText, label: "Product documents" },
} as const;

/**
 * One finding, laid out like a pentest report entry:
 * claim → evidence → impact → rule → remediation (before / after + Copy fix) → confidence.
 */
export function FindingCard({ finding, n, className }: { finding: Finding; n?: number; className?: string }) {
  const [copied, setCopied] = useState(false);
  const src = SOURCE[finding.evidence.source ?? "page"];
  const SrcIcon = src.icon;
  const isTextFix = finding.category === "truth" || finding.category === "legal" || finding.category === "trust";

  async function copy() {
    try {
      await navigator.clipboard.writeText(finding.fix);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <article className={cn("rounded-lg border bg-card", className)} aria-labelledby={`${finding.id}-title`}>
      <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        {n !== undefined && <FrameNumber n={n} severity={finding.severity} active />}
        <SeverityBadge severity={finding.severity} />
        <CategoryIcon category={finding.category} withLabel short={false} />
        <span className="num ml-auto text-2xs text-muted-foreground">{finding.id}</span>
      </header>

      <div className="px-4 pb-4 pt-3">
        <h3 id={`${finding.id}-title`} className="text-base font-semibold text-balance text-foreground">
          {finding.title}
        </h3>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-[8.5rem_1fr]">
          <dt className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">Claim</dt>
          <dd className="font-medium text-foreground">“{finding.claim}”</dd>

          <dt className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">Evidence</dt>
          <dd>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SrcIcon aria-hidden className="size-3.5 shrink-0" />
              {finding.evidence.document ?? src.label}
            </span>
            {finding.evidence.url && <span className="num mt-0.5 block truncate text-2xs text-muted-foreground">{finding.evidence.url}</span>}
            {finding.evidence.snippet && (
              <p className="mt-1.5 rounded-sm border bg-muted/60 px-2.5 py-2 text-xs leading-relaxed text-foreground">{finding.evidence.snippet}</p>
            )}
          </dd>

          <dt className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">Impact</dt>
          <dd className="max-w-[65ch] text-foreground/90">{finding.risk}</dd>

          {finding.rule && (
            <>
              <dt className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">Rule</dt>
              <dd className="text-foreground/90">{finding.rule}</dd>
            </>
          )}

          <dt className="text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground sm:pt-0.5">Remediation</dt>
          <dd>
            {isTextFix ? (
              <div className="rounded-sm border">
                <p className="border-b px-2.5 py-2 text-xs text-muted-foreground">
                  <span className="sr-only">Original: </span>
                  <del className="decoration-sev-critical/70 decoration-[1.5px]">{finding.claim}</del>
                </p>
                <p className="bg-ok/8 px-2.5 py-2 text-sm font-medium text-foreground">
                  <span className="sr-only">Proposed: </span>
                  {finding.fix}
                </p>
              </div>
            ) : (
              <p className="max-w-[65ch] text-foreground">{finding.fix}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={copy} aria-live="polite">
                {copied ? <Check aria-hidden className="size-3.5 text-ok-fg" /> : <Copy aria-hidden className="size-3.5" />}
                {copied ? "Copied" : "Copy fix"}
              </Button>
              <span className="text-2xs text-muted-foreground">
                Confidence <span className="num text-foreground">{Math.round(finding.confidence * 100)}%</span>
              </span>
            </div>
          </dd>
        </dl>
      </div>
    </article>
  );
}
