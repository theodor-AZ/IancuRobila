"use client";

import type { ReactNode } from "react";
import { RotateCcw, ShieldOff, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Error state: names the problem and the recovery.
 * variant "blocked" = the landing page refuses automated visits (bot wall). It is not an empty result.
 */
export function ErrorState({
  title,
  description,
  variant = "error",
  onRetry,
  retryLabel = "Try again",
  secondaryAction,
  className,
}: {
  title: string;
  description?: ReactNode;
  variant?: "error" | "blocked";
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: ReactNode;
  className?: string;
}) {
  const Icon = variant === "blocked" ? ShieldOff : TriangleAlert;
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-lg border border-sev-critical/40 bg-sev-critical-bg p-4", className)}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-sev-critical-fg" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        {(onRetry || secondaryAction) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcw aria-hidden className="size-3.5" />
                {retryLabel}
              </Button>
            )}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
