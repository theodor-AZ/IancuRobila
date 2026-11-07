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
      ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
      : animatedScore >= 55
      ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
      : "text-red-400 border-red-500/40 bg-red-500/10";

  return (
    <div className="space-y-6 print:space-y-4">
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                  Red Team Audit Report
                </Badge>
                <span className="text-xs text-slate-400 font-mono">ID: {scan.id}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  Category: <strong className="text-slate-200 uppercase">{scan.productCategory}</strong>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white">{scan.campaignName}</h1>
              <p className="text-xs text-slate-400 font-mono">{scan.landingPageUrl}</p>
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
                <Button variant="outline" size="sm" onClick={() => window.print()} className="bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800">
                  <Printer className="w-4 h-4 mr-2" /> Export PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setHideCriticalDemo(!hideCriticalDemo)} className="text-xs text-slate-400 hover:text-slate-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  {hideCriticalDemo ? "Show All Risks" : "Simulate Clean State"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2.5 mt-6 pt-6 border-t border-slate-800">
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40">
              <div className="text-[11px] text-red-400 uppercase font-semibold">Critical</div>
              <div className="text-xl font-bold text-white">{countBySeverity("critical")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-950/30 border border-orange-900/40">
              <div className="text-[11px] text-orange-400 uppercase font-semibold">High</div>
              <div className="text-xl font-bold text-white">{countBySeverity("high")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40">
              <div className="text-[11px] text-amber-300 uppercase font-semibold">Medium</div>
              <div className="text-xl font-bold text-white">{countBySeverity("medium")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/40">
              <div className="text-[11px] text-blue-400 uppercase font-semibold">Low</div>
              <div className="text-xl font-bold text-white">{countBySeverity("low")}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Legal</div>
              <div className="text-lg font-semibold text-slate-200">{countByCategory("legal")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Truth</div>
              <div className="text-lg font-semibold text-slate-200">{countByCategory("truth")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Conversion</div>
              <div className="text-lg font-semibold text-slate-200">{countByCategory("conversion")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">A11y</div>
              <div className="text-lg font-semibold text-slate-200">{countByCategory("accessibility")}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-[11px] text-slate-400">Brand Trust</div>
              <div className="text-lg font-semibold text-slate-200">{countByCategory("trust")}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {criticalCount === 0 && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-white">No critical vulnerabilities found</h3>
              <p className="text-xs text-emerald-300/80">This campaign passed primary blocking checks.</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Ready for Launch Review</Badge>
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
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Detected Vulnerabilities ({filteredFindings.length})</span>
          </div>

          <Tabs value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setShowAllFindings(false); }} className="print:hidden">
            <TabsList className="bg-slate-900 border border-slate-800 flex-wrap h-auto">
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
            className="w-full py-6 bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-700 transition-all shadow-sm"
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