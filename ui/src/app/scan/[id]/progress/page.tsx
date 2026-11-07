import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getMockScan } from "@/lib/mock";
import { getScan } from "@/lib/scans";
import { ProgressClient } from "./progress-client";

async function Progress({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) notFound();
  return (
    <ProgressClient
      id={id}
      simulate={!!getMockScan(id)}
      adImage={scan.adImage || undefined}
      campaign={scan.campaign}
    />
  );
}

export default function ProgressPage({ params }: PageProps<"/scan/[id]/progress">) {
  return (
    <Suspense fallback={null}>
      <Progress params={params} />
    </Suspense>
  );
}
