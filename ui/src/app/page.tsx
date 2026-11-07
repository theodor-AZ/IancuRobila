'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Scan, Finding } from '@/types/finding';
import type { Scan as StoredScan } from '@/lib/types';
import { DEMO_FINDINGS, DEMO_SCANS, isDemoId, toUIReport, toUIScan } from '@/lib/adapters/template';
import { NewScanScreen, type NewScanInput } from '@/components/claim-guard/NewScanScreen';
import { ScanProgress } from '@/components/claim-guard/ScanProgress';
import { ScanReport } from '@/components/claim-guard/ScanReport';
import { ScanHistoryScreen } from '@/components/claim-guard/ScanHistoryScreen';
import { Shield, PlusCircle, History, Loader2 } from 'lucide-react';

type Report = { scan: Scan; findings: Finding[] };

function demoReport(id: string): Report {
  const scan = DEMO_SCANS.find((s) => s.id === id) ?? DEMO_SCANS[0];
  return { scan, findings: DEMO_FINDINGS.filter((f) => f.scanId === scan.id) };
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'new' | 'progress' | 'report' | 'history'>('report');
  const [activeScanId, setActiveScanId] = useState<string>('scan-demo-1');
  const [progressScanId, setProgressScanId] = useState<string | undefined>(undefined);
  const [scans, setScans] = useState<Scan[]>(DEMO_SCANS);
  const [report, setReport] = useState<Report | null>(() => demoReport('scan-demo-1'));
  const [reportError, setReportError] = useState('');

  // Istoric: scanările reale din store (cele mai noi primele), apoi cele demonstrative.
  const refreshScans = useCallback(async () => {
    try {
      const r = await fetch('/api/scans', { cache: 'no-store' });
      if (!r.ok) return;
      const real = ((await r.json()) as StoredScan[])
        .map(toUIScan)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setScans([...real, ...DEMO_SCANS]);
    } catch {
      // serverul nu răspunde: rămân doar scanările demonstrative
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- încărcare inițială de date externe
    refreshScans();
  }, [refreshScans]);

  const openReport = useCallback(async (id: string) => {
    setActiveScanId(id);
    setReportError('');
    setActiveTab('report');
    if (isDemoId(id)) {
      setReport(demoReport(id));
      return;
    }
    setReport(null);
    try {
      const r = await fetch(`/api/scans/${id}`, { cache: 'no-store' });
      if (!r.ok) throw new Error();
      const stored = (await r.json()) as StoredScan;
      if (stored.status === 'running') {
        setProgressScanId(id);
        setActiveTab('progress');
        return;
      }
      if (stored.status !== 'done') {
        setReportError(stored.error ?? 'Scanarea nu s-a finalizat.');
        return;
      }
      setReport(toUIReport(stored));
    } catch {
      setReportError('Nu am putut încărca raportul. Verifică dacă serverul rulează.');
    }
  }, []);

  const handleStartScan = async (input: NewScanInput) => {
    const form = new FormData();
    form.set('adText', input.adText);
    form.set('landingUrl', input.landingUrl);
    form.set('productCategory', input.productCategory);
    if (input.adImage) form.set('adImage', input.adImage);
    for (const d of input.documents) form.append('documents', d);
    const r = await fetch('/api/scans', { method: 'POST', body: form });
    const body = (await r.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!r.ok || !body.id) throw new Error(body.error ?? 'Scanarea nu a putut porni. Încearcă din nou.');
    setProgressScanId(body.id);
    setActiveScanId(body.id);
    setActiveTab('progress');
  };

  const handleCompleteProgress = () => {
    refreshScans();
    if (progressScanId) openReport(progressScanId);
    else {
      setActiveScanId('scan-demo-1');
      setReport(demoReport('scan-demo-1'));
      setActiveTab('report');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                ClaimGuard <span className="text-indigo-400">X</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Red Team AI Marketing Auditor</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'new'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Scanare Nouă
            </button>

            <button
              onClick={() => openReport(activeScanId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'report'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Raport Activ
            </button>

            <button
              onClick={() => {
                refreshScans();
                setActiveTab('history');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Istoric
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="flex-1 pb-16">
        {activeTab === 'new' && <NewScanScreen onStartScan={handleStartScan} />}
        {activeTab === 'progress' && (
          <ScanProgress
            key={progressScanId ?? 'demo'}
            scanId={progressScanId}
            onComplete={handleCompleteProgress}
            onRetry={() => setActiveTab('new')}
          />
        )}
        {activeTab === 'report' &&
          (reportError ? (
            <div className="max-w-xl mx-auto py-16 px-4 text-center text-sm text-red-300">{reportError}</div>
          ) : report ? (
            <ScanReport key={report.scan.id} scan={report.scan} findings={report.findings} />
          ) : (
            <div className="py-24 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" aria-label="Se încarcă raportul" />
            </div>
          ))}
        {activeTab === 'history' && <ScanHistoryScreen scans={scans} onSelectScan={openReport} />}
      </div>
    </main>
  );
}
