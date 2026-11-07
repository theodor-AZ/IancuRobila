"use client";

import { cn } from "@/lib/utils";
import type { Frame, Severity } from "@/lib/types";

const STROKE: Record<Severity, string> = {
  critical: "border-sev-critical text-sev-critical",
  high: "border-sev-high text-sev-high",
  medium: "border-sev-medium text-sev-medium",
  low: "border-sev-low text-sev-low",
};
const TAG: Record<Severity, string> = {
  critical: "bg-sev-critical",
  high: "bg-sev-high",
  medium: "bg-sev-medium",
  low: "bg-sev-low",
};

/**
 * Signature move: a numbered threat frame drawn over a capture, like a screening console boxing an item.
 * Position is in % of the parent, so place it inside a `relative` wrapper around the image.
 * The same number appears on the finding's row; `active` links the two.
 */
export function ThreatFrame({
  n,
  frame,
  severity,
  active = false,
  dimmed = false,
  label,
  onActivate,
  onDeactivate,
  onSelect,
}: {
  n: number;
  frame: Frame;
  severity: Severity;
  active?: boolean;
  dimmed?: boolean;
  label: string;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Finding ${n}: ${label}`}
      aria-pressed={active}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      onClick={onSelect}
      className={cn(
        "group absolute cursor-pointer rounded-xs border-[1.5px] transition-[opacity,box-shadow,background-color] duration-200 ease-(--ease-out-expo)",
        STROKE[severity],
        active ? "z-10 bg-current/12 shadow-[0_0_0_3px_color-mix(in_oklch,currentColor_30%,transparent)]" : "bg-current/5",
        dimmed && !active && "opacity-35",
      )}
      style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%` }}
    >
      {/* corner brackets */}
      <span aria-hidden className="pointer-events-none absolute -left-[3px] -top-[3px] size-2 border-l-2 border-t-2 border-current" />
      <span aria-hidden className="pointer-events-none absolute -right-[3px] -top-[3px] size-2 border-r-2 border-t-2 border-current" />
      <span aria-hidden className="pointer-events-none absolute -bottom-[3px] -left-[3px] size-2 border-b-2 border-l-2 border-current" />
      <span aria-hidden className="pointer-events-none absolute -bottom-[3px] -right-[3px] size-2 border-b-2 border-r-2 border-current" />
      <span
        aria-hidden
        className={cn(
          "num absolute -top-[2px] left-0 grid h-[18px] min-w-[18px] -translate-y-full place-items-center rounded-t-xs px-1 text-[11px] font-semibold text-background",
          TAG[severity],
        )}
      >
        {String(n).padStart(2, "0")}
      </span>
    </button>
  );
}

/** Number chip used on table rows and cards; matches the frame tag. */
export function FrameNumber({ n, severity, active = false }: { n: number; severity: Severity; active?: boolean }) {
  return (
    <span
      className={cn(
        "num inline-grid h-5 min-w-6 place-items-center rounded-xs border px-1 text-[11px] font-semibold",
        active ? cn(TAG[severity], "border-transparent text-background") : "border-border-strong text-muted-foreground",
      )}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}
