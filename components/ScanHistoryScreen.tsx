"use client";

import React from "react";
import Link from "next/link";
import { ScanSummary } from "@/types/finding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Globe, ShieldCheck, ShieldAlert } from "lucide-react";

interface ScanHistoryScreenProps {
  scans: ScanSummary[];
  onSelectScan?: (scanId: string) => void;
}

export function ScanHistoryScreen({ scans, onSelectScan }: ScanHistoryScreenProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Campaign Audit History</h2>
          <p className="text-xs text-slate-400">
            Previously analyzed marketing campaigns and Red Team risk scores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scans.map((scan) => {
          const criticalCount = scan.findings.filter((f) => f.severity === "critical").length;
          const isClean = scan.score >= 80;

          return (
            <Card
              key={scan.id}
              className="bg-slate-900 border-slate-800 text-slate-100 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase border-slate-700 text-slate-300">
                    {scan.productCategory}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(scan.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-white mt-2 line-clamp-2">
                  {scan.campaignName}
                </CardTitle>
                <p className="text-xs text-slate-400 flex items-center gap-1 font-mono truncate">
                  <Globe className="w-3 h-3 shrink-0" /> {scan.landingPageUrl}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Safety Score</div>
                    <div
                      className={`text-2xl font-extrabold ${
                        isClean
                          ? "text-emerald-400"
                          : scan.score >= 55
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {scan.score}/100
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-slate-400">Findings</div>
                    <div className="text-sm font-semibold text-white">
                      {scan.findings.length} total ({criticalCount} critical)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectScan && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectScan(scan.id)}
                      className="flex-1 bg-slate-950 border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
                    >
                      Preview Here
                    </Button>
                  )}
                  <Link href={`/scan/${scan.id}`} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                    >
                      Open Report <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}