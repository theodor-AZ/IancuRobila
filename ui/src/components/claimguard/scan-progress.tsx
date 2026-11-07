"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const SCAN_STEPS = [
  { key: "claims", label: "Extracting claims", detail: "Reading the ad copy, image text and product documents" },
  { key: "page", label: "Checking landing page", detail: "Rendering on desktop and a 390 px phone, extracting price and conditions" },
  { key: "links", label: "Testing links and speed", detail: "Every call-to-action, redirects, mobile load time" },
  { key: "a11y", label: "Running accessibility checks", detail: "Automated axe-core checks" },
  { key: "cross", label: "Cross-checking ad, page and evidence", detail: "Matching each claim against the page and the documents" },
] as const;

export type StepState = "pending" | "running" | "done";

/**
 * Scan progress. Driven by `current` (index of the running step) when the real pipeline reports progress;
 * with `simulate`, a timer walks through the steps (for the sandbox / demo).
 * Signature motion: a scan beam sweeps the ad thumbnail while the scan runs.
 */
export function ScanProgress({
  adImage,
  campaign,
  current: currentProp,
  simulate = false,
  stepMs = 1600,
  onDone,
}: {
  adImage?: string;
  campaign: string;
  current?: number;
  simulate?: boolean;
  stepMs?: number;
  onDone?: () => void;
}) {
  const [simCurrent, setSimCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const current = simulate ? simCurrent : (currentProp ?? 0);
  const done = current >= SCAN_STEPS.length;

  useEffect(() => {
    if (!simulate || done) return;
    const t = setTimeout(() => setSimCurrent((c) => c + 1), stepMs);
    return () => clearTimeout(t);
  }, [simulate, simCurrent, stepMs, done]);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => onDone?.(), 700);
      return () => clearTimeout(t);
    }
    const i = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(i);
  }, [done, onDone]);

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/40 scan-grid">
        {adImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={adImage} alt="Ad being scanned" className={cn("h-full w-full object-contain p-3 transition-[filter] duration-700", !done && "grayscale-[0.4] contrast-[1.05]")} />
        )}
        {!done && <div aria-hidden className="cgx-beam pointer-events-none absolute inset-x-0 h-16" />}
      </div>

      <div className="min-w-0">
        <p className="num text-2xs text-muted-foreground">{(elapsed / 1000).toFixed(1)} s</p>
        <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em]" aria-live="polite">
          {done ? "Scan complete" : `Scanning ${campaign}`}
        </h1>
        <ol className="mt-6 grid gap-1">
          {SCAN_STEPS.map((s, i) => {
            const state: StepState = i < current ? "done" : i === current ? "running" : "pending";
            return (
              <li key={s.key} className={cn("flex gap-3 rounded-md px-3 py-2.5", state === "running" && "bg-accent")}>
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                    state === "done" && "border-ok bg-ok text-background",
                    state === "running" && "border-beam text-beam-fg",
                    state === "pending" && "border-border-strong",
                  )}
                >
                  {state === "done" && <Check aria-hidden className="size-3" strokeWidth={3} />}
                  {state === "running" && <Loader2 aria-hidden className="size-3 animate-spin motion-reduce:animate-none" />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", state === "pending" ? "text-muted-foreground" : "text-foreground")}>
                    {s.label}
                    {state === "running" && "…"}
                    <span className="sr-only">{state === "done" ? " (done)" : state === "running" ? " (in progress)" : " (waiting)"}</span>
                  </span>
                  <span className="block text-xs text-muted-foreground">{s.detail}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <style>{`
        .cgx-beam {
          top: -4rem;
          background: linear-gradient(to bottom, transparent, color-mix(in oklch, var(--beam) 28%, transparent) 85%, var(--beam) 98%, transparent);
          animation: cgx-sweep 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        @keyframes cgx-sweep { to { top: 100%; } }
        @media (prefers-reduced-motion: reduce) { .cgx-beam { animation: none; top: 45%; opacity: .6; } }
      `}</style>
    </div>
  );
}
