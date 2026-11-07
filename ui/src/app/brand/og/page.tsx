import { LogoMark } from "@/components/brand/logo";

/** 1200×630 share image source. Screenshot this route to produce public/brand/og.png. */
export default function OgSource() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-background">
      <div className="scan-grid relative flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden bg-background p-16">
        <div className="flex items-center gap-4">
          <LogoMark size={56} className="text-foreground" />
          <span className="text-[40px] font-semibold tracking-[-0.02em] text-foreground">
            ClaimGuard <span className="text-beam-fg">X</span>
          </span>
        </div>
        <div>
          <p className="max-w-[900px] text-[64px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground text-balance">
            Find the flaws. Prove the risks. Fix the campaign.
          </p>
          <p className="mt-6 text-[26px] text-muted-foreground">AI Marketing Red Team</p>
        </div>
        <div aria-hidden className="absolute right-16 top-16 h-[150px] w-[260px] rounded-xs border-2 border-sev-critical bg-sev-critical/10">
          <span className="num absolute -top-[2px] left-0 -translate-y-full rounded-t-xs bg-sev-critical px-2 py-0.5 text-[20px] font-semibold text-background">01</span>
          <span className="absolute inset-0 grid place-items-center text-[52px] font-bold text-sev-critical-fg">-50%</span>
        </div>
      </div>
    </div>
  );
}
