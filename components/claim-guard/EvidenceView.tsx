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
    <Card className="bg-slate-900/90 border-slate-800 text-slate-100">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            Side-by-Side Evidence Inspector — &ldquo;Prove the Risks&rdquo;
          </CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {findings.slice(0, 5).map((f) => (
              <button
                key={f.id}
                onClick={() => onSelectFinding?.(f)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  highlighted?.id === f.id
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
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
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-pink-400" /> Submitted Ad Creative
              </span>
              <Badge variant="outline" className="text-[11px] border-slate-700 text-slate-400">
                Source: Ad Copy + Visual
              </Badge>
            </div>

            {/* Simulated Ad Visual Preview */}
            <div className="relative rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">Sponsored • GlowBotanics Official</span>
                <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded">
                  Ad Preview
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{adText}</p>

              {highlighted && (
                <div className="p-3 rounded-lg bg-red-500/15 border-2 border-red-500/70 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-red-300 font-semibold mb-1">
                    <span>FLAGGED CLAIM IN AD</span>
                    <span className="uppercase">{highlighted.severity} RISK</span>
                  </div>
                  <p className="text-sm font-medium text-white">&ldquo;{highlighted.claim}&rdquo;</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Landing Page Snapshot & Technical Evidence */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" /> Landing Page & Dossier Snapshot
              </span>
              <span className="text-xs text-slate-500 font-mono truncate max-w-[220px]">
                {landingPageUrl}
              </span>
            </div>

            {highlighted ? (
              <div className="space-y-3">
                {/* Simulated Browser Frame */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 overflow-hidden">
                  <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    <span className="ml-2 text-[11px] text-slate-400 font-mono truncate">
                      {highlighted.evidence.source}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                        <Eye className="w-3 h-3 mr-1" /> Highlighted Region:{" "}
                        {highlighted.evidence.location || "DOM Element"}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border-2 border-dashed border-amber-500/60">
                      <p className="text-xs text-amber-200 font-mono leading-relaxed">
                        {highlighted.evidence.snippet}
                      </p>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <FileWarning className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Mismatch / Vulnerability Proof: </span>
                        {highlighted.risk}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select a finding to inspect side-by-side evidence.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}