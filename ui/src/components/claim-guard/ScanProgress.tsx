'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Radio, CheckCircle, ShieldAlert, ArrowLeft } from 'lucide-react';

interface ScanProgressProps {
  onComplete: () => void;
  /** ID-ul unei scanări reale: pașii urmează scannerul (GET /api/scans/[id]). Fără el, progresul e simulat. */
  scanId?: string;
  /** Afișat pe ecranul de eroare: întoarcere la formular. */
  onRetry?: () => void;
}

// Pașii 0–4 corespund pașilor reali ai scannerului (src/lib/pipeline.ts); ultimul e raportul.
const STEPS = [
  'Citire documente de dovezi (PDF) și extragere afirmații...',
  'Descărcare Landing Page, captură și extragere ofertă...',
  'Testare link-uri și viteză pe mobil...',
  'Verificare accesibilitate (WCAG) și navigare cu tastatura...',
  'Comparare reclamă ↔ landing page ↔ dovezi pe regulile juridice...',
  'Sintetizare raport final executiv...'
];

export const ScanProgress: React.FC<ScanProgressProps> = ({ onComplete, scanId, onRetry }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [failure, setFailure] = useState<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  // Scanare reală: interogăm serverul la fiecare secundă.
  useEffect(() => {
    if (!scanId) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const r = await fetch(`/api/scans/${scanId}`, { cache: 'no-store' });
        if (r.ok) {
          const s = (await r.json()) as { status: string; step?: number; error?: string };
          if (stop) return;
          if (s.status === 'done') {
            setCurrentStepIndex(STEPS.length - 1);
            timer = setTimeout(() => onCompleteRef.current(), 800);
            return;
          }
          if (s.status === 'blocked' || s.status === 'failed') {
            setFailure(s.error ?? 'Scanarea s-a oprit înainte să se termine.');
            return;
          }
          setCurrentStepIndex(Math.min(s.step ?? 0, STEPS.length - 2));
        }
      } catch {
        // rețea întreruptă: reîncercăm la următorul tick
      }
      if (!stop) timer = setTimeout(poll, 1000);
    };
    poll();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [scanId]);

  // Demo fără server: progres simulat, ca în template.
  useEffect(() => {
    if (scanId) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => onCompleteRef.current(), 800);
          return prev;
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [scanId]);

  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);

  if (failure) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/60 text-red-400 border border-red-800/80 mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Scanarea nu s-a putut finaliza</h2>
        <p className="text-sm text-slate-300 bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left break-words">
          {failure}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Înapoi la formular
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600/20 animate-ping" />
        <div className="w-20 h-20 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
          <Radio className="w-8 h-8 text-indigo-400" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-100 mb-2">Scanare Tehnică în Desfășurare</h2>
      <p className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-6">
        ClaimGuard AI Agent Active Scanner
      </p>

      {/* BARA DE PROGRES */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3 mb-4 overflow-hidden p-0.5">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="text-right text-xs font-mono text-slate-400 mb-6">
        {progressPercent}% Finalizat
      </div>

      {/* PAȘI LIVE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left space-y-2.5">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs transition-opacity ${
                isDone
                  ? 'text-slate-400'
                  : isCurrent
                  ? 'text-indigo-300 font-semibold'
                  : 'text-slate-600'
              }`}
            >
              {isDone ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
              )}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
