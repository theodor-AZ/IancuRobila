import type { ReactNode } from "react";
import { ScanLine, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Empty state: what is empty, why, and the one action that fills it. */
export function EmptyState({
  title,
  description,
  icon: Icon = ScanLine,
  action,
  tone = "neutral",
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  /** "clear" = a good empty result (e.g. no critical findings). */
  tone?: "neutral" | "clear";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center", className)}>
      <span
        className={cn(
          "grid size-10 place-items-center rounded-md border",
          tone === "clear" ? "border-ok/40 text-ok-fg" : "border-border-strong text-muted-foreground",
        )}
      >
        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
      </span>
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
