"use client";

import React from "react";
import { Finding } from "@/types/finding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Globe, Megaphone, FileWarning, ArrowLeftRight } from "lucide-react";

interface EvidenceViewProps {
  adText: string;
  landingPageUrl: string;
  findings: Finding[];
  activeFinding?: Finding | null;
  onSelectFinding?: (finding: Finding) => void;
}

export function EvidenceView({
  adText,
  landingPageUrl,
  findings,
  activeFinding,
  onSelectFinding,
}: EvidenceViewProps) {
  const highlighted = activeFinding || findings[0];

  return (
    <Card className="bg-card border-border text-foreground">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-beam-fg" />
            Side-by-Side Evidence Inspector — &ldquo;Prove the Risks&rdquo;
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {findings.slice(0, 5).map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFinding?.(f)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  highlighted?.id === f.id
                    ? "bg-accent border-beam/40 text-beam-fg font-medium"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.title.slice(0, 26)}...
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Ad Creative & Copy */}
          <div className="rounded-xl bg-background border border-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-beam-fg" /> Submitted Ad Creative
              </span>
              <Badge variant="outline" className="text-[11px] border-border-strong text-muted-foreground">
                Source: Ad Copy + Visual
              </Badge>
            </div>

            {/* Simulated Ad Visual Preview */}
            <div className="relative rounded-lg bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Sponsored • GlowBotanics Official</span>
                <span className="text-[10px] bg-accent text-beam-fg border border-beam/40 px-2 py-0.5 rounded">
                  Ad Preview
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{adText}</p>

              {highlighted && (
                <div className="p-3 rounded-lg bg-sev-critical-bg border-2 border-sev-critical/40 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-sev-critical-fg font-semibold mb-1">
                    <span>FLAGGED CLAIM IN AD</span>
                    <span className="uppercase">{highlighted.severity} RISK</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">&ldquo;{highlighted.claim}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Landing Page Snapshot & Technical Evidence */}
          <div className="rounded-xl bg-background border border-border p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-beam-fg" /> Landing Page & Dossier Snapshot
              </span>
              <span className="text-xs text-muted-foreground font-mono truncate max-w-[220px]">
                {landingPageUrl}
              </span>
            </div>

            {highlighted ? (
              <div className="space-y-3">
                {/* Simulated Browser Frame */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="bg-card px-3 py-1.5 border-b border-border flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sev-critical-bg" />
                    <span className="w-2.5 h-2.5 rounded-full bg-sev-medium-bg" />
                    <span className="w-2.5 h-2.5 rounded-full bg-ok/10" />
                    <span className="ml-2 text-[11px] text-muted-foreground font-mono truncate">
                      {highlighted.evidence.source}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-sev-medium-bg text-sev-medium-fg border border-sev-medium/40 text-xs">
                        <Eye className="w-3 h-3 mr-1" /> Highlighted Region:{" "}
                        {highlighted.evidence.location || "DOM Element"}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-sev-medium-bg border-2 border-dashed border-sev-medium/40">
                      <p className="text-xs text-sev-medium-fg font-mono leading-relaxed">
                        {highlighted.evidence.snippet}
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-background border border-border text-xs text-muted-foreground flex items-start gap-2">
                      <FileWarning className="w-4 h-4 text-sev-critical-fg shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Mismatch / Vulnerability Proof: </span>
                        {highlighted.risk}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Select a finding to inspect side-by-side evidence.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}