"use client";

import { FileText, Globe, Megaphone } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { FrameNumber } from "@/components/ui/threat-frame";
import { cn } from "@/lib/utils";
import type { Finding } from "@/lib/types";

/**
 * Pentest-style findings register: one row per finding, ordered by severity.
 * The row number is the same as the threat frame number in the evidence view.
 */
export function FindingsTable({
  findings,
  numberOf,
  activeId,
  selectedId,
  onActivate,
  onSelect,
}: {
  findings: Finding[];
  numberOf: (f: Finding) => number;
  activeId?: string | null;
  selectedId?: string | null;
  onActivate?: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Findings ordered by severity</caption>
        <thead className="bg-muted/50 text-left text-2xs uppercase tracking-[0.06em] text-muted-foreground">
          <tr>
            <th scope="col" className="w-12 px-3 py-2 font-semibold">#</th>
            <th scope="col" className="w-28 px-2 py-2 font-semibold">Severity</th>
            <th scope="col" className="px-2 py-2 font-semibold">Finding</th>
            <th scope="col" className="hidden w-16 px-2 py-2 font-semibold md:table-cell">Found in</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => {
            const n = numberOf(f);
            const active = activeId === f.id;
            const selected = selectedId === f.id;
            const sources = new Set<string>(f.evidence.frames?.map((fr) => fr.target) ?? []);
            if (f.evidence.source === "document") sources.add("document");
            return (
              <tr
                key={f.id}
                onMouseEnter={() => onActivate?.(f.id)}
                onMouseLeave={() => onActivate?.(null)}
                onClick={() => onSelect?.(f.id)}
                aria-selected={selected}
                className={cn(
                  "cursor-pointer border-t transition-colors",
                  selected ? "bg-accent" : active ? "bg-muted/60" : "hover:bg-muted/40",
                )}
              >
                <td className="px-3 py-2.5 align-top">
                  <FrameNumber n={n} severity={f.severity} active={active || selected} />
                </td>
                <td className="px-2 py-2.5 align-top">
                  <SeverityBadge severity={f.severity} size="sm" />
                </td>
                <td className="px-2 py-2.5 align-top">
                  <button
                    type="button"
                    onFocus={() => onActivate?.(f.id)}
                    onBlur={() => onActivate?.(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(f.id);
                    }}
                    className="text-left font-medium text-foreground hover:underline focus-visible:underline"
                  >
                    {f.title}
                  </button>
                  <div className="mt-1">
                    <CategoryIcon category={f.category} withLabel />
                  </div>
                </td>
                <td className="hidden px-2 py-2.5 align-top md:table-cell">
                  <span className="flex gap-1.5 pt-0.5 text-muted-foreground">
                    {sources.has("ad") && <Megaphone aria-label="Ad" role="img" className="size-3.5" />}
                    {sources.has("page") && <Globe aria-label="Landing page" role="img" className="size-3.5" />}
                    {sources.has("document") && <FileText aria-label="Documents" role="img" className="size-3.5" />}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
