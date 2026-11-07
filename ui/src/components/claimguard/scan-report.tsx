"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Globe, Megaphone, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon, CATEGORY_META } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { SEVERITY_META } from "@/components/ui/severity-badge";
import { EvidenceView } from "./evidence-view";
import { FindingCard } from "./finding-card";
import { FindingsTable } from "./findings-table";
import { bySeverity, campaignScore, countBySeverity } from "@/lib/score";
import { CATEGORIES, SEVERITIES, type Category, type Scan } from "@/lib/types";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

/**
 * The Red Team report, structured like a pentest deliverable:
 * 1 Executive summary · 2 Scope · 3 Findings (register + evidence + detail) · 4 Methodology & limitations.
 */
export function ScanReport({ scan }: { scan: Scan }) {
  const ordered = useMemo(() => [...scan.findings].sort(bySeverity), [scan.findings]);
  const numbers = useMemo(() => new Map(ordered.map((f, i) => [f.id, i + 1])), [ordered]);
  const numberOf = (f: { id: string }) => numbers.get(f.id) ?? 0;

  const [filter, setFilter] = useState<Category | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(ordered[0]?.id ?? null);

  const visible = filter === "all" ? ordered : ordered.filter((f) => f.category === filter);
  const selected = ordered.find((f) => f.id === selectedId) ?? null;
  const score = campaignScore(scan.findings);
  const counts = countBySeverity(scan.findings);
  const critical = ordered.filter((f) => f.severity === "critical");

  function select(id: string) {
    setSelectedId(id);
    document.getElementById("finding-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-6 sm:px-6">
      {/* Report header */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b pb-5">
        <div className="min-w-0">
          <p className="num text-2xs text-muted-foreground">
            {scan.id} · {DATE.format(new Date(scan.createdAt))} · {(scan.durationMs / 1000).toFixed(1)} s
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-balance">
            Red Team report: {scan.brand} {scan.campaign}
          </h1>
        </div>
        <Button variant="outline" size="sm" className="no-print ml-auto" onClick={() => window.print()}>
          <Download aria-hidden className="size-3.5" />
          Export PDF
        </Button>
      </div>

      {/* 1 Executive summary */}
      <section aria-labelledby="summary" className="grid gap-6 border-b py-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)]">
        <h2 id="summary" className="sr-only">Executive summary</h2>
        <ScoreGauge score={score} />

        <div className="min-w-0 self-center">
          <p className="text-sm font-semibold text-foreground">Executive summary</p>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {scan.findings.length === 0 ? (
              "No vulnerabilities found across the ad, the landing page and the documents."
            ) : (
              <>
                We found <span className="text-foreground">{scan.findings.length} vulnerabilities</span> across the ad, the landing
                page and the product documents.{" "}
                {critical.length > 0 ? (
                  <>
                    Fix the <span className="text-sev-critical-fg">{critical.length} critical</span> before launch:{" "}
                    {critical.map((f, i) => (
                      <span key={f.id}>
                        <span className="text-foreground">{f.title.charAt(0).toLowerCase() + f.title.slice(1)}</span>
                        {i < critical.length - 1 ? "; " : "."}
                      </span>
                    ))}
                  </>
                ) : (
                  "No critical vulnerabilities found."
                )}
              </>
            )}
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {SEVERITIES.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-2 rounded-[1px]", SEVERITY_META[s].dot)} />
                <dt className="text-xs text-muted-foreground">{SEVERITY_META[s].label}</dt>
                <dd className="num text-sm font-semibold text-foreground">{counts[s]}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* risk matrix: category × severity */}
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full text-xs">
            <caption className="mb-2 text-left text-sm font-semibold text-foreground">Risk matrix</caption>
            <thead>
              <tr className="text-muted-foreground">
                <th scope="col" className="py-1 pr-2 text-left font-normal">Category</th>
                {SEVERITIES.map((s) => (
                  <th key={s} scope="col" className="w-14 py-1 text-center font-normal">{SEVERITY_META[s].label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c} className="border-t">
                  <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                    <CategoryIcon category={c} withLabel />
                  </th>
                  {SEVERITIES.map((s) => {
                    const n = scan.findings.filter((f) => f.category === c && f.severity === s).length;
                    return (
                      <td key={s} className="py-1 text-center">
                        <span
                          className={cn(
                            "num inline-grid h-6 w-9 place-items-center rounded-xs",
                            n ? cn(SEVERITY_META[s].className, "font-semibold") : "text-muted-foreground/50",
                          )}
                        >
                          {n || "·"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2 Scope */}
      <section aria-labelledby="scope" className="border-b py-5">
        <h2 id="scope" className="text-sm font-semibold">Scope</h2>
        <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <li className="flex min-w-0 gap-2">
            <Megaphone aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span className="line-clamp-2">{scan.adImage ? "Ad text and image" : "Ad text (no image)"}</span>
          </li>
          <li className="flex min-w-0 gap-2">
            <Globe aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span className="num truncate">{scan.landingUrl}</span>
          </li>
          <li className="flex min-w-0 gap-2">
            <FileText aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span className="truncate">{scan.documents.length ? scan.documents.join(", ") : "No documents provided"}</span>
          </li>
          <li className="flex min-w-0 gap-2">
            <Tag aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{scan.productCategory === "cosmetics" ? "Cosmetics (Regulation 655/2013 applies)" : "General product"}</span>
          </li>
        </ul>
      </section>

      {/* 3 Findings */}
      <section aria-labelledby="findings" className="py-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="findings" className="text-lg font-semibold">Findings</h2>
          <div role="tablist" aria-label="Filter by category" className="no-print flex flex-wrap gap-1">
            {(["all", ...CATEGORIES] as const).map((c) => {
              const n = c === "all" ? ordered.length : ordered.filter((f) => f.category === c).length;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={filter === c}
                  onClick={() => setFilter(c)}
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-xs transition-colors",
                    filter === c ? "border-border-strong bg-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c === "all" ? "All" : CATEGORY_META[c].short}
                  <span className="num text-muted-foreground">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {counts.critical === 0 && scan.findings.length > 0 && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-ok-fg">
            <CheckCircle2 aria-hidden className="size-4" /> No critical vulnerabilities found.
          </p>
        )}

        <EvidenceView
          className="mt-4"
          adImage={scan.adImage}
          adText={scan.adText}
          pageCapture={scan.pageCapture}
          pageCaptureSize={scan.pageCaptureSize}
          landingUrl={scan.landingUrl}
          findings={visible}
          numberOf={numberOf}
          activeId={activeId}
          onActivate={setActiveId}
          onSelect={select}
        />

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {visible.length ? (
            <FindingsTable
              findings={visible}
              numberOf={numberOf}
              activeId={activeId}
              selectedId={selectedId}
              onActivate={setActiveId}
              onSelect={select}
            />
          ) : (
            <EmptyState
              tone="clear"
              icon={CheckCircle2}
              title={`No ${filter === "all" ? "" : CATEGORY_META[filter].short.toLowerCase() + " "}vulnerabilities found`}
              description="Nothing in this category needs attention for this campaign."
            />
          )}
          <div id="finding-detail" className="lg:sticky lg:top-20">
            {selected ? (
              <FindingCard finding={selected} n={numberOf(selected)} />
            ) : (
              <EmptyState title="Select a finding" description="Pick a row or a frame to see the evidence, impact and fix." />
            )}
          </div>
        </div>
      </section>

      {/* 4 Methodology & limitations */}
      <section aria-labelledby="method" className="border-t pt-5">
        <h2 id="method" className="text-sm font-semibold">Methodology and limitations</h2>
        <ul className="mt-2 grid max-w-[75ch] gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <li>The ad, the rendered landing page (desktop and 390 px mobile) and the uploaded documents were analysed together, and claims were compared across all three.</li>
          <li>Accessibility results come from automated axe-core checks only. They catch a subset of issues and do not cover all WCAG requirements.</li>
          <li>Claim checks (truth, legal, trust) in this version are rule-based: ad, page and document text are matched against a rule library. Technical checks (links, speed, accessibility) run in a real browser.</li>
          {scan.warnings?.map((w) => (
            <li key={w} className="text-sev-medium-fg">Not checked: {w}</li>
          ))}
          <li>ClaimGuard X flags risks and missing evidence. It does not give legal verdicts or declare a message false. Confirm legal findings with counsel.</li>
        </ul>
      </section>
    </div>
  );
}
