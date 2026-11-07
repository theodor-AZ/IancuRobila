"use client";

import { useRouter } from "next/navigation";
import { ScanProgress } from "@/components/claimguard/scan-progress";

export function ProgressClient({ id, adImage, campaign }: { id: string; adImage?: string; campaign: string }) {
  const router = useRouter();
  return <ScanProgress simulate adImage={adImage} campaign={campaign} onDone={() => router.push(`/scan/${id}`)} />;
}
