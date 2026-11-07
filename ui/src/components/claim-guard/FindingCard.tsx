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
  critical: "bg-sev-critical-bg text-sev-critical-fg border-sev-critical/40",
  high: "bg-sev-high-bg text-sev-high-fg border-sev-high/40",
  medium: "bg-sev-medium-bg text-sev-medium-fg border-sev-medium/40",
  low: "bg-sev-low-bg text-sev-low-fg border-sev-low/40",
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
    <Card className="bg-card border-border text-foreground shadow-lg hover:border-border-strong transition-all">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`uppercase font-semibold text-xs ${severityStyles[finding.severity]}`}>
              {finding.severity}
            </Badge>
            <Badge variant="secondary" className="bg-muted text-muted-foreground border-border-strong flex items-center gap-1.5 text-xs">
              {cat.icon}
              {cat.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Confidence: {Math.round(finding.confidence * 100)}%
          </span>
        </div>
        <CardTitle className="text-lg font-semibold text-foreground mt-2">
          {finding.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* Evidence & Rule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-medium uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-beam-fg" /> Evidence Found
              </span>
              {finding.evidence.location && (
                <span className="text-muted-foreground">{finding.evidence.location}</span>
              )}
            </div>
            <p className="text-foreground font-medium text-xs mb-1">{finding.evidence.source}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{finding.evidence.snippet}</p>
          </div>

          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-sev-medium-fg" /> Risk & Applicable Rule
            </div>
            <p className="text-foreground text-xs leading-relaxed mb-1.5">{finding.risk}</p>
            {finding.rule && (
              <p className="text-[11px] text-muted-foreground font-mono bg-card px-2 py-1 rounded border border-border">
                Rule: {finding.rule}
              </p>
            )}
          </div>
        </div>

        {/* Before / After Fix Comparison (Detaliu care face diferenta) */}
        <div className="p-3.5 rounded-lg bg-background border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ok-fg flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Red Team Remediation (Before / After)
            </span>
            <div className="flex items-center gap-2">
              {onSelectEvidence && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectEvidence(finding)}
                  className="h-7 text-xs text-beam-fg hover:text-beam-fg hover:bg-accent"
                >
                  Inspect Evidence
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyFix}
                className="h-7 text-xs bg-card border-border-strong hover:bg-muted text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-ok-fg" /> Copied
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
            <div className="p-2 rounded bg-sev-critical-bg border border-sev-critical/40 text-sev-critical-fg">
              <span className="font-mono uppercase text-[10px] text-sev-critical-fg mr-2">[Target Claim]</span>
              <span className="line-through decoration-sev-critical">{finding.claim}</span>
            </div>
            <div className="p-2 rounded bg-ok/10 border border-ok/40 text-ok-fg">
              <span className="font-mono uppercase text-[10px] text-ok-fg mr-2">[Proposed Fix]</span>
              <span className="font-medium">{finding.fix}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}