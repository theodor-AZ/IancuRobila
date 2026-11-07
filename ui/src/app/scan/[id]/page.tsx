import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { ScanReport } from '@/components/claim-guard/ScanReport';
import { DEMO_FINDINGS, DEMO_SCANS, toUIReport } from '@/lib/adapters/template';
import { getScan } from '@/lib/scans';
import { LiveScan } from './live-scan';

/** Link direct către un raport: /scan/scan-demo-1 (demo) sau /scan/<id> (scanare reală). */
export default function ScanPage({ params }: PageProps<'/scan/[id]'>) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-8">
      <Suspense fallback={null}>
        <ScanContent params={params} />
      </Suspense>
    </main>
  );
}

async function ScanContent({ params }: { params: PageProps<'/scan/[id]'>['params'] }) {
  await connection();
  const { id } = await params;

  const demo = DEMO_SCANS.find((s) => s.id === id);
  if (demo) {
    return <ScanReport scan={demo} findings={DEMO_FINDINGS.filter((f) => f.scanId === demo.id)} />;
  }

  const stored = await getScan(id);
  if (!stored) notFound();
  if (stored.status === 'running') return <LiveScan id={id} />;
  if (stored.status !== 'done') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Scanarea nu s-a putut finaliza</h1>
        <p className="text-sm text-slate-300">{stored.error}</p>
      </div>
    );
  }
  const { scan, findings } = toUIReport(stored);
  return <ScanReport scan={scan} findings={findings} />;
}
