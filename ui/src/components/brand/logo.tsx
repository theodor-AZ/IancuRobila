import { cn } from "@/lib/utils";

/**
 * ClaimGuard X mark: a scanner viewfinder (four corner brackets) with the X crossing inside.
 * One stroke of the X is the beam colour; the other is the foreground.
 */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <path d="M3 10V4.5C3 3.7 3.7 3 4.5 3H10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M22 3h5.5c.8 0 1.5.7 1.5 1.5V10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M29 22v5.5c0 .8-.7 1.5-1.5 1.5H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M10 29H4.5C3.7 29 3 28.3 3 27.5V22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M10 10l12 12" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" />
      <path d="M22 10L10 22" stroke="var(--beam)" strokeWidth="3.2" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <LogoMark size={size} />
      <span className="font-semibold tracking-[-0.02em]" style={{ fontSize: size * 0.68 }}>
        ClaimGuard <span className="text-beam-fg">X</span>
      </span>
    </span>
  );
}
