"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewScanScreen } from "@/components/claim-guard/NewScanScreen";
import { ErrorState } from "@/components/ui/error-state";

/** Colleague 1's form starts a real scan (text + URL; his form collects file names only). */
export default function Coleg1NewScan() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
      {error && <ErrorState className="mb-4" title="The scan could not start" description={error} />}
      <NewScanScreen
        onStartScan={async (p) => {
          setError(null);
          const body = new FormData();
          body.set("adText", p.adText);
          body.set("landingUrl", p.landingPageUrl);
          body.set("productCategory", p.productCategory);
          body.set("campaign", p.campaignName);
          const r = await fetch("/api/scans", { method: "POST", body });
          const data = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
          if (!r.ok || !data.id) return setError(data.error ?? "Try again.");
          router.push(`/scan/${data.id}/progress?view=coleg1`);
        }}
      />
    </div>
  );
}
