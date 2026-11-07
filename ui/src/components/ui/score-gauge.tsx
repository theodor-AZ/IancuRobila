"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SCORE_BAND_LABEL, scoreBand, type ScoreBand } from "@/lib/score";

const BAND_COLOR: Record<ScoreBand, string> = {
  critical: "var(--sev-critical)",
  "at-risk": "var(--sev-high)",
  fair: "var(--sev-medium)",
  good: "var(--ok)",
};
const BAND_TEXT: Record<ScoreBand, string> = {
  critical: "text-sev-critical-fg",
  "at-risk": "text-sev-high-fg",
  fair: "text-sev-medium-fg",
  good: "text-ok-fg",
};

/**
 * Campaign score dial (0–100), drawn like an instrument gauge with tick marks.
 * Sweeps up from 0 once on mount; holds still under prefers-reduced-motion.
 */
export function ScoreGauge({
  score,
  size = 168,
  animate = true,
  className,
}: {
  score: number;
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const target = Math.max(0, Math.min(100, Math.round(score)));
  const [shown, setShown] = useState(animate ? 0 : target);

  useEffect(() => {
    const still = !animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const t0 = performance.now();
    const dur = still ? 0 : 1100;
    const tick = (t: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(2, -10 * p); // expo out
      setShown(Math.round(target * (p === 1 ? 1 : eased)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);

  const band = scoreBand(target);
  // 240° arc, open at the bottom.
  const r = 42;
  const c = 2 * Math.PI * r;
  const arc = c * (240 / 360);
  const filled = arc * (shown / 100);
  const ticks = Array.from({ length: 21 }, (_, i) => -120 + i * 12);

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`Campaign score ${target} out of 100: ${SCORE_BAND_LABEL[band]}`}>
        {ticks.map((deg, i) => (
          <line
            key={deg}
            x1="50"
            y1={i % 5 === 0 ? 2.5 : 4}
            x2="50"
            y2="6.5"
            stroke="var(--border-strong)"
            strokeWidth={i % 5 === 0 ? 0.9 : 0.5}
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="5"
          strokeDasharray={`${arc} ${c}`} transform="rotate(150 50 50)" strokeLinecap="butt"
        />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={BAND_COLOR[band]} strokeWidth="5"
          strokeDasharray={`${filled} ${c}`} transform="rotate(150 50 50)" strokeLinecap="butt"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center leading-none">
          <span className="num font-semibold text-foreground" style={{ fontSize: size * 0.27 }}>{shown}</span>
          <span className="num mt-1 text-[11px] text-muted-foreground">/ 100</span>
          <span className={cn("mt-2 font-semibold uppercase tracking-[0.06em]", BAND_TEXT[band])} style={{ fontSize: Math.max(9, Math.min(12, size * 0.068)) }}>{SCORE_BAND_LABEL[band]}</span>
        </div>
      </div>
    </div>
  );
}
