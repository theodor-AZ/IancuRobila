import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getMockScan } from "@/lib/mock";
import { getScan } from "@/lib/scans";
import { ProgressClient } from "./progress-client";

async function Progress({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const { id } = await params;
  const { view } = await searchParams;
  const scan = await getScan(id);
  if (!scan) notFound();
  return (
    <ProgressClient
      id={id}
      simulate={!!getMockScan(id)}
      adImage={scan.adImage || undefined}
      campaign={scan.campaign}
      reportHref={view === "coleg1" ? `/coleg1/scan/${id}` : `/scan/${id}`}
    />
  );
}

export default function ProgressPage({ params, searchParams }: PageProps<"/scan/[id]/progress">) {
  return (
    <Suspense fallback={null}>
      <Progress params={params} searchParams={searchParams} />
    </Suspense>
  );
}
