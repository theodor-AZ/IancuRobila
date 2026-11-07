'use client';

import { useRouter } from 'next/navigation';
import { ScanProgress } from '@/components/claim-guard/ScanProgress';

/** Scanare încă în curs: arată progresul real și reîncarcă pagina când raportul e gata. */
export function LiveScan({ id }: { id: string }) {
  const router = useRouter();
  return <ScanProgress scanId={id} onComplete={() => router.refresh()} onRetry={() => router.push('/')} />;
}
