import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { ScanReport } from "@/components/claimguard/scan-report";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { getScan } from "@/lib/scans";

export async function generateMetadata({ params }: PageProps<"/scan/[id]">): Promise<Metadata> {
  const { id } = await params;
  const scan = await getScan(id);
  return { title: scan ? `${scan.brand} ${scan.campaign}` : "Scan not found" };
}

async function Report({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const scan = await getScan(id);
  if (!scan) notFound();
  if (scan.status === "running") redirect(`/scan/${id}/progress`);
  if (scan.status === "blocked" || scan.status === "failed") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="num text-2xs text-muted-foreground">{scan.id}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-[-0.02em]">{scan.campaign}</h1>
        <ErrorState
          className="mt-6"
          variant={scan.status === "blocked" ? "blocked" : "error"}
          title={scan.status === "blocked" ? "We couldn’t open this landing page" : "The scan stopped before it finished"}
          description={scan.error}
          secondaryAction={<Link href="/scan/new" className={buttonVariants({ size: "sm", variant: "outline" })}>Start a new scan</Link>}
        />
      </div>
    );
  }
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
