"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Circle, ShieldAlert } from "lucide-react";

interface ScanProgressProps {
  campaignName: string;
  onComplete: () => void;
}

const SCAN_STEPS = [
  "Extracting marketing claims from ad copy and visual creative...",
  "Checking landing page offers, HTTP links, and mobile speed via Playwright...",
  "Auditing WCAG accessibility & visual contrast via axe-core...",
  "Cross-referencing claims against EU Directive 2024/825 & Regulation 655/2013...",
  "Evaluating dark patterns, inventory proofs, and generating Red Team fixes...",
];

export function ScanProgress({ campaignName, onComplete }: ScanProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= SCAN_STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [onComplete]);

  const progressPercent = Math.round(((currentStep + 1) / SCAN_STEPS.length) * 100);

  return (
    <Card className="bg-card border-border text-foreground max-w-2xl mx-auto shadow-2xl">
      <CardHeader className="text-center border-b border-border pb-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-accent border border-beam/40 flex items-center justify-center mb-2">
          <ShieldAlert className="w-6 h-6 text-beam-fg animate-pulse" />
        </div>
        <CardTitle className="text-lg text-foreground">Red Team Investigation in Progress</CardTitle>
        <p className="text-xs text-muted-foreground">Auditing: {campaignName}</p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>PIPELINE STATUS</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-muted" />
        </div>

        <div className="space-y-3">
          {SCAN_STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={step}
                className={`p-3 rounded-lg border flex items-center gap-3 text-xs transition-all ${
                  isDone
                    ? "bg-ok/10 border-ok/40 text-ok-fg"
                    : isCurrent
                    ? "bg-accent border-beam/40 text-foreground font-medium"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-ok-fg shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-beam-fg animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}