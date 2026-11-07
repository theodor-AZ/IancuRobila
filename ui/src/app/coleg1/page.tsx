import { Suspense } from "react";
import { connection } from "next/server";
import { ScanHistoryScreen } from "@/components/claim-guard/ScanHistoryScreen";
import { COLEG1_MOCK_SCANS, toScanSummary } from "@/lib/adapters/coleg1";
import { listScans } from "@/lib/store";

async function History() {
  await connection();
  const real = (await listScans()).filter((s) => s.status === "done").map(toScanSummary);
  return <ScanHistoryScreen scans={[...real, ...COLEG1_MOCK_SCANS]} />;
}

/** Colleague 1's screens, fed with real scans (adapter) plus his own demo data. */
export default function Coleg1Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <Suspense fallback={null}>
        <History />
      </Suspense>
    </div>
  );
}
