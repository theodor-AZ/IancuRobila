"use client";

import React, { useEffect, useState } from "react";
import { Finding, Category, Severity, ScanSummary } from "@/types/finding";
import { FindingCard } from "./FindingCard";
import { EvidenceView } from "./EvidenceView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  ShieldAlert,
  Printer,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ScanReportProps {
  scan: ScanSummary;
}

export function ScanReport({ scan }: ScanReportProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hideCriticalDemo, setHideCriticalDemo] = useState<boolean>(false);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [activeFinding, setActiveFinding] = useState<Finding | null>(scan.findings[0] || null);
  // NOU: Stare pentru a arăta toate cardurile sau doar primele 3
  const [showAllFindings, setShowAllFindings] = useState<boolean>(false);

  const displayedFindings = hideCriticalDemo
    ? scan.findings.filter((f) => f.severity !== "critical")
    : scan.findings;

  const targetScore = hideCriticalDemo ? Math.min(96, scan.score + 45) : scan.score;

  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.ceil(targetScore / 25));
    const interval = setInterval(() => {
      current += step;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(interval);
      } else {
        setAnimatedScore(current);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [targetScore]);

  const filteredFindings =
    selectedCategory === "all"
      ? displayedFindings
      : displayedFindings.filter((f) => f.category === selectedCategory);

  // NOU: Tăiem lista la 3 elemente dacă nu este apăsat butonul de Show All
  const visibleFindings = showAllFindings ? filteredFindings : filteredFindings.slice(0, 3);

  const countBySeverity = (sev: Severity) => displayedFindings.filter((f) => f.severity === sev).length;
  const countByCategory = (cat: Category) => displayedFindings.filter((f) => f.category === cat).length;
  const criticalCount = countBySeverity("critical");

  const scoreColor =
    animatedScore >= 80
      ? "text-ok-fg border-ok/40 bg-ok/10"
      : animatedScore >= 55
      ? "text-sev-medium-fg border-sev-medium/40 bg-sev-medium-bg"
      : "text-sev-critical-fg border-sev-critical/40 bg-sev-critical-bg";

  return (
    <div className="space-y-6 print:space-y-4">
      <Card className="bg-card border-border text-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-accent text-beam-fg border-beam/40">
                  Red Team Audit Report
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">ID: {scan.id}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  Category: <strong className="text-foreground uppercase">{scan.productCategory}</strong>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{scan.campaignName}</h1>
              <p className="text-xs text-muted-foreground font-mono">{scan.landingPageUrl}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className={`px-5 py-3 rounded-2xl border-2 flex items-center gap-3 ${scoreColor}`}>
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold opacity-80">Safety Score</div>
                  <div className="text-3xl font-extrabold tabular-nums">
                    {animatedScore}<span className="text-sm font-normal opacity-70">/100</span>
                  </div>
                </div>
                {criticalCount === 0 ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
              </div>

              <div className="flex flex-col gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-background border-border-strong text-foreground hover:bg-muted">
                  <Printer className="w-4 h-4 mr-2" /> Export PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setHideCriticalDemo(!hideCriticalDemo)} className="text-xs text-muted-foreground hover:text-foreground">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  {hideCriticalDemo ? "Show All Risks" : "Simulate Clean State"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 mt-6 pt-6 border-t border-border">
            <div className="p-2.5 rounded-lg bg-sev-critical-bg border border-sev-critical/40">
              <div className="text-[11px] text-sev-critical-fg uppercase font-semibold">Critical</div>
              <div className="text-xl font-bold text-foreground">{countBySeverity("critical")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-sev-high-bg border border-sev-high/40">
              <div className="text-[11px] text-sev-high-fg uppercase font-semibold">High</div>
              <div className="text-xl font-bold text-foreground">{countBySeverity("high")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-sev-medium-bg border border-sev-medium/40">
              <div className="text-[11px] text-sev-medium-fg uppercase font-semibold">Medium</div>
              <div className="text-xl font-bold text-foreground">{countBySeverity("medium")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-sev-low-bg border border-sev-low/40">
              <div className="text-[11px] text-sev-low-fg uppercase font-semibold">Low</div>
              <div className="text-xl font-bold text-foreground">{countBySeverity("low")}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-background border border-border">
              <div className="text-[11px] text-muted-foreground">Legal</div>
              <div className="text-lg font-semibold text-foreground">{countByCategory("legal")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <div className="text-[11px] text-muted-foreground">Truth</div>
              <div className="text-lg font-semibold text-foreground">{countByCategory("truth")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <div className="text-[11px] text-muted-foreground">Conversion</div>
              <div className="text-lg font-semibold text-foreground">{countByCategory("conversion")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <div className="text-[11px] text-muted-foreground">A11y</div>
              <div className="text-lg font-semibold text-foreground">{countByCategory("accessibility")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border">
              <div className="text-[11px] text-muted-foreground">Brand Trust</div>
              <div className="text-lg font-semibold text-foreground">{countByCategory("trust")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {criticalCount === 0 && (
        <div className="p-4 rounded-xl bg-ok/10 border border-ok/40 flex items-center justify-between text-ok-fg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-ok-fg shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">No critical vulnerabilities found</h3>
              <p className="text-xs text-ok-fg">This campaign passed primary blocking checks.</p>
            </div>
          </div>
          <Badge className="bg-ok/10 text-ok-fg border-ok/40">Ready for Launch Review</Badge>
        </div>
      )}

      <EvidenceView
        adText={scan.adText}
        landingPageUrl={scan.landingPageUrl}
        findings={displayedFindings}
        activeFinding={activeFinding}
        onSelectFinding={(f) => setActiveFinding(f)}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Filter className="w-4 h-4 text-beam-fg" />
            <span>Detected Vulnerabilities ({filteredFindings.length})</span>
          </div>

          <Tabs value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setShowAllFindings(false); }} className="print:hidden">
            <TabsList className="bg-card border border-border flex-wrap h-auto">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="legal" className="text-xs">Legal</TabsTrigger>
              <TabsTrigger value="truth" className="text-xs">Truth</TabsTrigger>
              <TabsTrigger value="conversion" className="text-xs">Conversion</TabsTrigger>
              <TabsTrigger value="accessibility" className="text-xs">A11y</TabsTrigger>
              <TabsTrigger value="trust" className="text-xs">Trust</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {visibleFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onSelectEvidence={(f) => {
                setActiveFinding(f);
                window.scrollTo({ top: 260, behavior: "smooth" });
              }}
            />
          ))}
        </div>

        {/* NOU: Butonul care deschide restul listei */}
        {filteredFindings.length > 3 && (
          <Button
            variant="outline"
            onClick={() => setShowAllFindings(!showAllFindings)}
            className="w-full py-6 bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border-strong transition-all shadow-sm"
          >
            {showAllFindings ? (
              <>Hide Extra Findings <ChevronUp className="w-4 h-4 ml-2" /></>
            ) : (
              <>Load {filteredFindings.length - 3} More Vulnerabilities <ChevronDown className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}