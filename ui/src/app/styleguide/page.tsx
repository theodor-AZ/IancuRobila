"use client";

import { Logo, LogoMark } from "@/components/brand/logo";
import { FindingCard } from "@/components/claimguard/finding-card";
import { Button } from "@/components/ui/button";
import { CategoryIcon, CATEGORY_META } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ScoreGauge } from "@/components/ui/score-gauge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { FrameNumber, ThreatFrame } from "@/components/ui/threat-frame";
import { CheckCircle2 } from "lucide-react";
import findings from "@/mock/findings.json";
import { CATEGORIES, SEVERITIES, type Finding } from "@/lib/types";

const SURFACES = [
  { name: "background", v: "--background" },
  { name: "card", v: "--card" },
  { name: "popover", v: "--popover" },
  { name: "muted", v: "--muted" },
  { name: "border", v: "--border" },
  { name: "border-strong", v: "--border-strong" },
  { name: "foreground", v: "--foreground" },
  { name: "muted-foreground", v: "--muted-foreground" },
  { name: "beam (accent)", v: "--beam" },
  { name: "ok", v: "--ok" },
];
const TYPE = [
  { cls: "text-3xl", px: 44, use: "Score numerals" },
  { cls: "text-2xl", px: 32, use: "Page title" },
  { cls: "text-xl", px: 24, use: "Screen title" },
  { cls: "text-lg", px: 20, use: "Section title" },
  { cls: "text-base", px: 16, use: "Finding title" },
  { cls: "text-sm", px: 14, use: "Body, tables" },
  { cls: "text-xs", px: 13, use: "Secondary text" },
  { cls: "text-2xs", px: 12, use: "Labels, meta" },
];
const SPACE = [4, 8, 12, 16, 24, 32];
const RADII = [
  { name: "xs", px: 2, use: "threat frames, chips" },
  { name: "sm", px: 4, use: "badges, filters" },
  { name: "md", px: 6, use: "inputs, drop zones" },
  { name: "lg", px: 8, use: "panels, buttons" },
];

function Section({ id, title, children, note }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t py-8">
      <h2 id={id} className="text-lg font-semibold">{title}</h2>
      {note && <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function StyleGuide() {
  const f = findings as Finding[];
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">ClaimGuard X style guide</h1>
      <p className="mt-2 max-w-[70ch] text-sm text-muted-foreground">
        The visual language is a security scanner: the campaign is screened and every problem is boxed and numbered on the capture. The
        information is structured like a pentest report. Dark is the default theme. Use the sun/moon button to check the light theme.
        Tokens live in <code className="num text-foreground">src/app/globals.css</code>.
      </p>

      <Section id="brand" title="Logo">
        <div className="flex flex-wrap items-center gap-8">
          <Logo size={40} />
          <LogoMark size={40} />
          <LogoMark size={16} />
          <span className="text-sm text-muted-foreground">Viewfinder brackets + X. One stroke of the X is the beam colour.</span>
        </div>
      </Section>

      <Section id="colour" title="Colour" note="Restrained strategy: blue-tinted neutrals, one cyan beam accent for interaction and scan state. Severity colours appear only where they carry meaning.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SURFACES.map((s) => (
            <div key={s.v} className="overflow-hidden rounded-lg border">
              <div className="h-14" style={{ background: `var(${s.v})` }} />
              <div className="px-2.5 py-2">
                <p className="text-xs font-medium">{s.name}</p>
                <p className="num text-2xs text-muted-foreground">{s.v}</p>
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-6 text-sm font-semibold">Severity</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          {SEVERITIES.map((s) => (
            <div key={s} className="rounded-lg border p-3">
              <div className="flex gap-1.5">
                <span className="h-8 flex-1 rounded-xs" style={{ background: `var(--sev-${s})` }} title={`--sev-${s}`} />
                <span className="h-8 flex-1 rounded-xs border" style={{ background: `var(--sev-${s}-bg)` }} title={`--sev-${s}-bg`} />
              </div>
              <p className="mt-2 text-sm font-semibold" style={{ color: `var(--sev-${s}-fg)` }}>Text on ground</p>
              <p className="num text-2xs text-muted-foreground">--sev-{s} · -fg · -bg</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="type" title="Type" note="Geist Sans for the interface. Geist Mono with tabular numerals only for measurements: scores, IDs, URLs, timings.">
        <div className="grid gap-3">
          {TYPE.map((t) => (
            <div key={t.cls} className="flex items-baseline gap-4 border-b pb-3 last:border-0">
              <span className="num w-20 shrink-0 text-2xs text-muted-foreground">{t.cls} · {t.px}</span>
              <span className={`${t.cls} ${t.px >= 20 ? "font-semibold tracking-[-0.02em]" : ""} min-w-0 truncate`}>
                {t.cls === "text-3xl" ? <span className="num">38</span> : "Discount in the ad differs from the landing page"}
              </span>
              <span className="ml-auto hidden shrink-0 text-xs text-muted-foreground sm:block">{t.use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="space" title="Spacing and radii">
        <div className="flex flex-wrap items-end gap-5">
          {SPACE.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <span className="block bg-beam" style={{ width: s, height: s }} />
              <span className="num text-2xs text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          {RADII.map((r) => (
            <div key={r.name} className="flex items-center gap-3">
              <span className="block size-12 border-2 border-border-strong bg-muted" style={{ borderRadius: r.px }} />
              <span className="text-xs">
                <span className="num block text-foreground">rounded-{r.name} · {r.px}px</span>
                <span className="text-muted-foreground">{r.use}</span>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="sev" title="SeverityBadge" note="The word and a distinct icon shape are always present, so severity never relies on colour alone.">
        <div className="flex flex-wrap items-center gap-3">
          {SEVERITIES.map((s) => <SeverityBadge key={s} severity={s} />)}
          <span className="mx-2 h-5 w-px bg-border" />
          {SEVERITIES.map((s) => <SeverityBadge key={s} severity={s} size="sm" />)}
        </div>
      </Section>

      <Section id="cat" title="CategoryIcon">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c} className="flex gap-3 rounded-lg border p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border-strong text-foreground">
                <CategoryIcon category={c} className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-medium">{CATEGORY_META[c].label}{c === "trust" && <span className="font-normal text-muted-foreground"> (stretch goal)</span>}</span>
                <span className="block text-xs text-muted-foreground">{CATEGORY_META[c].description}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="gauge" title="ScoreGauge" note="Sweeps up once when the score is calculated; holds still under reduced motion.">
        <div className="flex flex-wrap items-end gap-8">
          <ScoreGauge score={24} />
          <ScoreGauge score={58} size={140} />
          <ScoreGauge score={77} size={120} />
          <ScoreGauge score={96} size={120} />
        </div>
      </Section>

      <Section id="frame" title="ThreatFrame and FrameNumber" note="The signature move. Each located finding is boxed on the capture with its number; the same number sits on its row in the findings table. Hover or focus either to link them.">
        <div className="flex flex-wrap items-center gap-6">
          <div className="scan-grid relative h-36 w-72 rounded-lg border bg-muted/40">
            <ThreatFrame n={1} severity="critical" frame={{ target: "page", x: 10, y: 30, w: 35, h: 30 }} label="Critical example" />
            <ThreatFrame n={2} severity="high" frame={{ target: "page", x: 55, y: 25, w: 30, h: 20 }} label="High example" active />
            <ThreatFrame n={3} severity="medium" frame={{ target: "page", x: 55, y: 62, w: 20, h: 18 }} label="Medium example" />
            <ThreatFrame n={4} severity="low" frame={{ target: "page", x: 80, y: 62, w: 12, h: 18 }} label="Low example" />
          </div>
          <div className="flex gap-2">
            <FrameNumber n={1} severity="critical" />
            <FrameNumber n={2} severity="high" active />
          </div>
        </div>
      </Section>

      <Section id="states" title="EmptyState and ErrorState">
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState title="No campaigns scanned yet" description="Run your first scan to see what could go wrong before launch." action={<Button size="sm">Run a scan</Button>} />
          <EmptyState tone="clear" icon={CheckCircle2} title="No critical vulnerabilities found" description="Nothing in this category needs attention for this campaign." />
          <ErrorState
            variant="blocked"
            title="We couldn’t open this landing page"
            description="glowpure.example blocks automated visits. Ask your web team to allowlist ClaimGuard X, or scan a staging URL."
            onRetry={() => {}}
          />
          <ErrorState title="The scan stopped before it finished" description="The landing page did not respond within 30 seconds. Check the URL and try again." onRetry={() => {}} />
        </div>
      </Section>

      <Section id="card" title="FindingCard" note="Pentest finding layout: claim, evidence, impact, rule, remediation with before/after and Copy fix, confidence.">
        <div className="grid gap-4 lg:grid-cols-2">
          <FindingCard finding={f[0]} n={1} />
          <FindingCard finding={f[1]} n={2} />
        </div>
      </Section>

      <Section id="buttons" title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Run Red Team scan</Button>
          <Button variant="outline">Export PDF</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>
    </div>
  );
}
