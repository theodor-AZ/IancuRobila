import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ScanReport } from "@/components/claim-guard/ScanReport";
import { COLEG1_MOCK_SCANS, toScanSummary } from "@/lib/adapters/coleg1";
import { getScan } from "@/lib/scans";

async function Report({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const mock = COLEG1_MOCK_SCANS.find((s) => s.id === id);
  if (mock) return <ScanReport scan={mock} />;
  const scan = await getScan(id);
  if (!scan) notFound();
  if (scan.status === "running") redirect(`/scan/${id}/progress?view=coleg1`);
  if (scan.status !== "done") redirect(`/scan/${id}`);
  return <ScanReport scan={toScanSummary(scan)} />;
}

export default function Coleg1ScanPage({ params }: PageProps<"/coleg1/scan/[id]">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <Suspense fallback={null}>
        <Report params={params} />
      </Suspense>
    </div>
  );
}
