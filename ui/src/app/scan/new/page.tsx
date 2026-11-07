"use client";

import { useRouter } from "next/navigation";
import { NewScanScreen, type NewScanInput } from "@/components/claimguard/new-scan-screen";

export default function NewScanPage() {
  const router = useRouter();

  async function start(v: NewScanInput) {
    const body = new FormData();
    body.set("adText", v.adText);
    body.set("landingUrl", v.landingUrl);
    body.set("productCategory", v.productCategory);
    if (v.adImage) body.set("adImage", v.adImage);
    for (const d of v.documents) body.append("documents", d);
    const r = await fetch("/api/scans", { method: "POST", body });
    const data = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!r.ok || !data.id) throw new Error(data.error ?? "The scan could not start. Try again.");
    router.push(`/scan/${data.id}/progress`);
  }

  return <NewScanScreen onSubmit={start} />;
}
