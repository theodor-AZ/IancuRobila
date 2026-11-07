"use client";

import { useEffect, useRef } from "react";
import { Globe, ImageOff, Megaphone } from "lucide-react";
import { ThreatFrame } from "@/components/ui/threat-frame";
import { cn } from "@/lib/utils";
import type { Finding } from "@/lib/types";

/**
 * "Prove the risks": the ad and the landing page capture side by side, with every located finding
 * drawn as a numbered threat frame. Long page captures scroll inside their pane, and the pane
 * follows the active finding.
 */
export function EvidenceView({
  adImage,
  adText,
  pageCapture,
  pageCaptureSize = { w: 1366, h: 935 },
  landingUrl,
  findings,
  numberOf,
  activeId,
  onActivate,
  onSelect,
  className,
}: {
  adImage?: string;
  adText?: string;
  pageCapture?: string;
  pageCaptureSize?: { w: number; h: number };
  landingUrl: string;
  findings: Finding[];
  numberOf: (f: Finding) => number;
  activeId?: string | null;
  onActivate?: (id: string | null) => void;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const pageScroll = useRef<HTMLDivElement>(null);

  // Bring the active frame into view inside the page pane (without scrolling the window).
  useEffect(() => {
    const box = pageScroll.current;
    if (!box || !activeId) return;
    const el = box.querySelector<HTMLElement>(`[data-finding="${CSS.escape(activeId)}"]`);
    if (!el) return;
    const top = el.offsetTop + ((el.offsetParent as HTMLElement | null)?.offsetTop ?? 0) - 48;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 80) box.scrollTo({ top, behavior: "smooth" });
  }, [activeId]);

  const framesFor = (target: "ad" | "page") =>
    findings.flatMap((f) => (f.evidence.frames ?? []).filter((fr) => fr.target === target).map((fr, i) => ({ f, fr, key: `${f.id}-${i}` })));

  const renderFrames = (target: "ad" | "page") =>
    framesFor(target).map(({ f, fr, key }) => (
        <ThreatFrame
          key={key}
          findingId={f.id}
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
    ));

  const adFrames = framesFor("ad").length;
  const pageFrames = framesFor("page").length;

  return (
    <div className={cn("grid gap-3 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1fr)]", className)}>
      <figure className="min-w-0 overflow-hidden rounded-lg border bg-card">
        <figcaption className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          <Megaphone aria-hidden className="size-3.5" />
          <span className="font-medium text-foreground">Ad</span>
          <span className="num ml-auto shrink-0">{adFrames} frames</span>
        </figcaption>
        <div className="scan-grid bg-muted/30 p-4 pt-7">
          {adImage ? (
            <div className="relative mx-auto w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={adImage} alt="Ad creative under review" className="block h-auto w-full rounded-xs shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)]" />
              {renderFrames("ad")}
            </div>
          ) : (
            <div className="rounded-md border bg-card p-4">
              <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
                <ImageOff aria-hidden className="size-3.5" /> No ad image uploaded. Ad copy:
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{adText}</p>
            </div>
          )}
        </div>
      </figure>

      <figure className="min-w-0 overflow-hidden rounded-lg border bg-card">
        <figcaption className="flex items-center gap-2 border-b px-3 py-2 text-xs text-muted-foreground">
          <Globe aria-hidden className="size-3.5" />
          <span className="font-medium text-foreground">Landing page</span>
          <span className="num truncate">{landingUrl}</span>
          <span className="num ml-auto shrink-0">{pageFrames} frames</span>
        </figcaption>
        <div ref={pageScroll} className="scan-grid relative max-h-[680px] overflow-y-auto bg-muted/30 p-4 pt-7">
          {pageCapture ? (
            <div className="relative mx-auto w-full" style={{ aspectRatio: `${pageCaptureSize.w} / ${pageCaptureSize.h}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pageCapture}
                alt={`Desktop capture of ${landingUrl}`}
                className="absolute inset-0 h-full w-full rounded-xs object-fill shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)]"
              />
              {renderFrames("page")}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No capture available for this page.</p>
          )}
        </div>
      </figure>
    </div>
  );
}
