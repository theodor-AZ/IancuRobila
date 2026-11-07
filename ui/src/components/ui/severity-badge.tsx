import { CircleAlert, Info, OctagonAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Severity } from "@/lib/types";

export const SEVERITY_META: Record<Severity, { label: string; icon: LucideIcon; className: string; dot: string }> = {
  critical: { label: "Critical", icon: OctagonAlert, className: "bg-sev-critical-bg text-sev-critical-fg", dot: "bg-sev-critical" },
  high: { label: "High", icon: TriangleAlert, className: "bg-sev-high-bg text-sev-high-fg", dot: "bg-sev-high" },
  medium: { label: "Medium", icon: CircleAlert, className: "bg-sev-medium-bg text-sev-medium-fg", dot: "bg-sev-medium" },
  low: { label: "Low", icon: Info, className: "bg-sev-low-bg text-sev-low-fg", dot: "bg-sev-low" },
};

/**
 * Severity label. Always prints the word and a distinct icon shape, so severity never relies on colour alone.
 */
export function SeverityBadge({
  severity,
  size = "md",
  className,
}: {
  severity: Severity;
  size?: "sm" | "md";
  className?: string;
}) {
  const m = SEVERITY_META[severity];
  const Icon = m.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold uppercase tracking-[0.06em]",
        size === "sm" ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-2xs",
        m.className,
        className,
      )}
    >
      <Icon aria-hidden className={size === "sm" ? "size-3" : "size-3.5"} strokeWidth={2.25} />
      {m.label}
    </span>
  );
}
