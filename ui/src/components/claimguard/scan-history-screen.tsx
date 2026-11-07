import Link from "next/link";
import { Plus, ScanLine } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SEVERITY_META } from "@/components/ui/severity-badge";
import { campaignScore, countBySeverity, SCORE_BAND_LABEL, scoreBand, type ScoreBand } from "@/lib/score";
import { SEVERITIES, type Scan } from "@/lib/types";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const BAND: Record<ScoreBand, string> = {
  critical: "text-sev-critical-fg",
  "at-risk": "text-sev-high-fg",
  fair: "text-sev-medium-fg",
  good: "text-ok-fg",
};

/** Scanned campaigns, newest first, with score and severity counts. */
export function ScanHistoryScreen({ scans }: { scans: Scan[] }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Scans</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every campaign you ran through the Red Team, newest first.</p>
        </div>
        <Link href="/scan/new" className={cn(buttonVariants(), "ml-auto")}>
          <Plus aria-hidden className="size-4" />
          New scan
        </Link>
      </div>

      {scans.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={ScanLine}
          title="No campaigns scanned yet"
          description="Run your first scan to see what could go wrong before launch."
          action={<Link href="/scan/new" className={buttonVariants({ size: "sm" })}>Run a scan</Link>}
        />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-2xs uppercase tracking-[0.06em] text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">Campaign</th>
                <th scope="col" className="px-3 py-2 font-semibold">Scanned</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Score</th>
                <th scope="col" className="px-3 py-2 font-semibold">Findings</th>
              </tr>
            </thead>
            <tbody>
              {[...scans]
                .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                .map((s) => {
                  const score = campaignScore(s.findings);
                  const band = scoreBand(score);
                  const counts = countBySeverity(s.findings);
                  return (
                    <tr key={s.id} className="border-t transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link href={`/scan/${s.id}`} className="font-medium text-foreground hover:underline">
                          {s.brand} · {s.campaign}
                        </Link>
                        <p className="num mt-0.5 truncate text-2xs text-muted-foreground">{s.id} · {s.landingUrl}</p>
                      </td>
                      <td className="num whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{DATE.format(new Date(s.createdAt))}</td>
                      <td className="px-3 py-3 text-right">
                        <span className="num text-base font-semibold text-foreground">{score}</span>
                        <span className={cn("block text-2xs font-semibold uppercase tracking-[0.06em]", BAND[band])}>{SCORE_BAND_LABEL[band]}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex flex-wrap gap-3">
                          {SEVERITIES.filter((sev) => counts[sev] > 0).map((sev) => (
                            <span key={sev} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <span aria-hidden className={cn("size-2 rounded-[1px]", SEVERITY_META[sev].dot)} />
                              <span className="num font-semibold text-foreground">{counts[sev]}</span> {SEVERITY_META[sev].label.toLowerCase()}
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
