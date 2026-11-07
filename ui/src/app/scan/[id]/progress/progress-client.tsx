"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanProgress } from "@/components/claimguard/scan-progress";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import type { Scan } from "@/lib/types";

/** Real scans poll /api/scans/[id]; mock demo scans run the simulated timer. */
export function ProgressClient({ id, simulate, adImage, campaign }: { id: string; simulate: boolean; adImage?: string; campaign: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [failure, setFailure] = useState<Pick<Scan, "status" | "error"> | null>(null);

  useEffect(() => {
    if (simulate) return;
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/scans/${id}`, { cache: "no-store" });
        if (r.ok) {
          const s = (await r.json()) as Scan;
          if (stop) return;
          if (s.status === "done") setStep(5);
          else if (s.status === "blocked" || s.status === "failed") {
            setFailure({ status: s.status, error: s.error });
            return;
          } else setStep(s.step ?? 0);
        }
      } catch {}
      if (!stop) setTimeout(poll, 1000);
    };
    poll();
    return () => {
      stop = true;
    };
  }, [id, simulate]);

  if (failure) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">{campaign}</h1>
        <ErrorState
          className="mt-6"
          variant={failure.status === "blocked" ? "blocked" : "error"}
          title={failure.status === "blocked" ? "We couldn’t open this landing page" : "The scan stopped before it finished"}
          description={failure.error}
          secondaryAction={<Link href="/scan/new" className={buttonVariants({ size: "sm", variant: "outline" })}>Start a new scan</Link>}
        />
      </div>
    );
  }

  return (
    <ScanProgress
      simulate={simulate}
      current={step}
      adImage={adImage}
      campaign={campaign}
      onDone={() => router.push(`/scan/${id}`)}
    />
  );
}
