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
    <Card className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl mx-auto shadow-2xl">
      <CardHeader className="text-center border-b border-slate-800 pb-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center mb-2">
          <ShieldAlert className="w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <CardTitle className="text-lg text-white">Red Team Investigation in Progress</CardTitle>
        <p className="text-xs text-slate-400">Auditing: {campaignName}</p>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>PIPELINE STATUS</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-slate-800" />
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
                    ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                    : isCurrent
                    ? "bg-indigo-950/40 border-indigo-500/60 text-white font-medium"
                    : "bg-slate-950/50 border-slate-800/60 text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
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