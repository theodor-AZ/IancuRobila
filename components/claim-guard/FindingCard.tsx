"use client";

import React, { useState } from "react";
import { Finding, Category, Severity } from "@/types/finding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Scale,
  FileSearch,
  MousePointerClick,
  Accessibility,
  ShieldAlert,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  onSelectEvidence?: (finding: Finding) => void;
}

const severityStyles: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/40",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/40",
};

const categoryMeta: Record<Category, { label: string; icon: React.ReactNode }> = {
  legal: { label: "Legal & Compliance", icon: <Scale className="w-3.5 h-3.5" /> },
  truth: { label: "Truth & Consistency", icon: <FileSearch className="w-3.5 h-3.5" /> },
  conversion: { label: "Conversion & UX", icon: <MousePointerClick className="w-3.5 h-3.5" /> },
  accessibility: { label: "Accessibility & Inclusion", icon: <Accessibility className="w-3.5 h-3.5" /> },
  trust: { label: "Brand Trust & Manipulation", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
};

export function FindingCard({ finding, onSelectEvidence }: FindingCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyFix = () => {
    navigator.clipboard.writeText(finding.fix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cat = categoryMeta[finding.category];

  return (
    <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-lg hover:border-slate-700 transition-all">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`uppercase font-semibold text-xs ${severityStyles[finding.severity]}`}>
              {finding.severity}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-slate-700 flex items-center gap-1.5 text-xs">
              {cat.icon}
              {cat.label}
            </Badge>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Confidence: {Math.round(finding.confidence * 100)}%
          </span>
        </div>
        <CardTitle className="text-lg font-semibold text-white mt-2">
          {finding.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* Evidence & Rule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Evidence Found
              </span>
              {finding.evidence.location && (
                <span className="text-slate-500">{finding.evidence.location}</span>
              )}
            </div>
            <p className="text-slate-200 font-medium text-xs mb-1">{finding.evidence.source}</p>
            <p className="text-slate-400 text-xs leading-relaxed">{finding.evidence.snippet}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risk & Applicable Rule
            </div>
            <p className="text-slate-200 text-xs leading-relaxed mb-1.5">{finding.risk}</p>
            {finding.rule && (
              <p className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
                Rule: {finding.rule}
              </p>
            )}
          </div>
        </div>

        {/* Before / After Fix Comparison (Detaliu care face diferenta) */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Red Team Remediation (Before / After)
            </span>
            <div className="flex items-center gap-2">
              {onSelectEvidence && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectEvidence(finding)}
                  className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50"
                >
                  Inspect Evidence
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFix}
                className="h-7 text-xs bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy fix
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded bg-red-950/25 border border-red-900/40 text-red-300/90">
              <span className="font-mono uppercase text-[10px] text-red-400 mr-2">[Target Claim]</span>
              <span className="line-through decoration-red-400/80">{finding.claim}</span>
            </div>
            <div className="p-2 rounded bg-emerald-950/25 border border-emerald-900/40 text-emerald-300">
              <span className="font-mono uppercase text-[10px] text-emerald-400 mr-2">[Proposed Fix]</span>
              <span className="font-medium">{finding.fix}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}