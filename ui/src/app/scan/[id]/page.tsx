import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ScanReport } from "@/components/claimguard/scan-report";
import { getMockScan, MOCK_SCANS } from "@/lib/mock";

export function generateStaticParams() {
  return MOCK_SCANS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/scan/[id]">): Promise<Metadata> {
  const { id } = await params;
  const scan = getMockScan(id);
  return { title: scan ? `${scan.brand} ${scan.campaign}` : "Scan not found" };
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scan = getMockScan(id);
  if (!scan) notFound();
  return <ScanReport scan={scan} />;
}

function ReportSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-4 pt-6 sm:px-6 motion-reduce:animate-none" aria-busy="true" aria-label="Loading report">
      <div className="h-3 w-56 rounded-xs bg-muted" />
      <div className="mt-3 h-8 w-2/3 rounded-xs bg-muted" />
      <div className="mt-8 h-40 rounded-lg bg-muted/60" />
    </div>
  );
}

export default function ScanPage({ params }: PageProps<"/scan/[id]">) {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <Report params={params} />
    </Suspense>
  );
}
