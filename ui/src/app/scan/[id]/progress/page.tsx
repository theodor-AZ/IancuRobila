import { Suspense } from "react";
import { getMockScan, MOCK_SCANS } from "@/lib/mock";
import { ProgressClient } from "./progress-client";

export function generateStaticParams() {
  return MOCK_SCANS.map((s) => ({ id: s.id }));
}

async function Progress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = getMockScan(id);
  return <ProgressClient id={id} adImage={scan?.adImage} campaign={scan ? `${scan.brand} ${scan.campaign}` : "campaign"} />;
}

export default function ProgressPage({ params }: PageProps<"/scan/[id]/progress">) {
  return (
    <Suspense fallback={null}>
      <Progress params={params} />
    </Suspense>
  );
}
