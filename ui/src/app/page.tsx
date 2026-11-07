import { Suspense } from "react";
import { connection } from "next/server";
import { ScanHistoryScreen } from "@/components/claimguard/scan-history-screen";
import { getAllScans } from "@/lib/scans";

async function History() {
  await connection();
  return <ScanHistoryScreen scans={await getAllScans()} />;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <History />
    </Suspense>
  );
}
