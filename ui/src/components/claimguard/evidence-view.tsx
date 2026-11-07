"use client";

import { Globe, Megaphone } from "lucide-react";
import { ThreatFrame } from "@/components/ui/threat-frame";
import { cn } from "@/lib/utils";
import type { Finding } from "@/lib/types";

/**
 * "Prove the risks": the ad and the landing page capture side by side, at the same height,
 * with every located finding drawn as a numbered threat frame.
 */
export function EvidenceView({
  adImage,
  pageCapture,
  landingUrl,
  findings,
  numberOf,
  activeId,
  onActivate,
  onSelect,
  className,
}: {
  adImage: string;
  pageCapture: string;
  landingUrl: string;
  findings: Finding[];
  numberOf: (f: Finding) => number;
  activeId?: string | null;
  onActivate?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const panes = [
    { target: "ad" as const, title: "Ad", icon: Megaphone, src: adImage, alt: "Ad creative under review", aspect: "1 / 1" },
    { target: "page" as const, title: "Landing page", icon: Globe, src: pageCapture, alt: `Desktop capture of ${landingUrl}`, aspect: "1366 / 935" },
  ];

  return (
    <div className={cn("grid gap-3 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)]", className)}>
      {panes.map((p) => {
        const Icon = p.icon;
        const located = findings.flatMap((f) =>
          (f.evidence.frames ?? []).filter((fr) => fr.target === p.target).map((fr, i) => ({ f, fr, key: `${f.id}-${i}` })),
        );
        return (
          <figure key={p.target} className="min-w-0 overflow-hidden rounded-lg border bg-card">
            <figcaption className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
              <Icon aria-hidden className="size-3.5" />
              <span className="font-medium text-foreground">{p.title}</span>
              {p.target === "page" && <span className="num truncate">{landingUrl}</span>}
              <span className="num ml-auto shrink-0">{located.length} frames</span>
            </figcaption>
            <div className="scan-grid bg-muted/30 p-4 pt-7">
              <div className="relative mx-auto w-full" style={{ aspectRatio: p.aspect }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.alt} className="absolute inset-0 h-full w-full rounded-xs object-contain shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)]" />
                {located.map(({ f, fr, key }) => (
                  <ThreatFrame
                    key={key}
                    n={numberOf(f)}
                    frame={fr}
                    severity={f.severity}
                    label={f.title}
                    active={activeId === f.id}
                    dimmed={!!activeId}
                    onActivate={() => onActivate?.(f.id)}
                    onDeactivate={() => onActivate?.(null)}
                    onSelect={() => onSelect?.(f.id)}
                  />
                ))}
              </div>
            </div>
          </figure>
        );
      })}
    </div>
  );
}
