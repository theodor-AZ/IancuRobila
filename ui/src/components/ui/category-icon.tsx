import { Accessibility, GitCompareArrows, MousePointerClick, Scale, ShieldAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

export const CATEGORY_META: Record<Category, { label: string; short: string; icon: LucideIcon; description: string }> = {
  legal: { label: "Legal & Compliance", short: "Legal", icon: Scale, description: "Claims checked against EU rules (Directive 2024/825, Regulation 655/2013)." },
  truth: { label: "Truth & Consistency", short: "Truth", icon: GitCompareArrows, description: "Ad, landing page and documents compared for contradictions." },
  conversion: { label: "Conversion & UX", short: "Conversion", icon: MousePointerClick, description: "Broken CTAs, redirects and mobile speed." },
  accessibility: { label: "Accessibility & Inclusion", short: "Accessibility", icon: Accessibility, description: "Automated axe-core checks (not a full WCAG audit)." },
  trust: { label: "Brand Trust & Manipulation", short: "Trust", icon: ShieldAlert, description: "Pressure tactics and unproven trust signals." },
};

/** Category icon, optionally with its label. One stroke weight for all five. */
export function CategoryIcon({
  category,
  withLabel = false,
  short = true,
  className,
}: {
  category: Category;
  withLabel?: boolean;
  short?: boolean;
  className?: string;
}) {
  const m = CATEGORY_META[category];
  const Icon = m.icon;
  if (!withLabel) return <Icon aria-label={m.label} role="img" className={cn("size-4 shrink-0", className)} strokeWidth={1.75} />;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", className)}>
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="text-xs">{short ? m.short : m.label}</span>
    </span>
  );
}
