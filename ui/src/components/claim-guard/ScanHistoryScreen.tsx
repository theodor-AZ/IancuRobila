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
          <h2 className="text-xl font-bold text-foreground">Campaign Audit History</h2>
          <p className="text-xs text-muted-foreground">
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
              className="bg-card border-border text-foreground flex flex-col justify-between hover:border-border-strong transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase border-border-strong text-muted-foreground">
                    {scan.productCategory}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(scan.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-foreground mt-2 line-clamp-2">
                  {scan.campaignName}
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono truncate">
                  <Globe className="w-3 h-3 shrink-0" /> {scan.landingPageUrl}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Safety Score</div>
                    <div
                      className={`text-2xl font-extrabold ${
                        isClean
                          ? "text-ok-fg"
                          : scan.score >= 55
                          ? "text-sev-medium-fg"
                          : "text-sev-critical-fg"
                      }`}
                    >
                      {scan.score}/100
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted-foreground">Findings</div>
                    <div className="text-sm font-semibold text-foreground">
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
                      className="flex-1 bg-background border-border-strong text-foreground hover:bg-muted text-xs"
                    >
                      Preview Here
                    </Button>
                  )}
                  <Link href={`/coleg1/scan/${scan.id}`} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full bg-primary hover:bg-primary text-primary-foreground text-xs"
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