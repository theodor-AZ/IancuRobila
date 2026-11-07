"use client";

import { useRouter } from "next/navigation";
import { NewScanScreen } from "@/components/claimguard/new-scan-screen";

export default function NewScanPage() {
  const router = useRouter();
  // Sandbox: no upload yet. The base will POST the input and route to the real scan id.
  return <NewScanScreen onSubmit={() => router.push("/scan/SCN-0042/progress")} />;
}
