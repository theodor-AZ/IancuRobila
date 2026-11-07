'use client';

import React from 'react';
import { Finding } from '@/types/finding';
import { X, ShieldAlert } from 'lucide-react';

interface EvidenceViewProps {
  finding: Finding | null;
  onClose: () => void;
  /** Captura landing page-ului (scanări reale); chenarele dovezii se desenează peste ea. */
  pageCapture?: string;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ finding, onClose, pageCapture }) => {
  if (!finding) return null;

  const frames = finding.evidence.frames ?? [];
  const showCapture = !!pageCapture && frames.length > 0;
  // Fereastra de captură e centrată pe primul chenar.
  const focusY = frames.length ? Math.max(0, frames[0].y + frames[0].h / 2) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Inspecție Dovadă Red Team: {finding.ruleId ?? finding.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Închide"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {finding.category}
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-2">{finding.title}</h3>
            <p className="text-sm text-slate-300 mt-1">{finding.riskDescription}</p>
          </div>

          {/* Comparativ Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ad Box */}
            <div className="border border-red-900/50 bg-red-950/20 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider block mb-2">
                  1. Promisiune Reclamă ({finding.evidence.adSource})
                </span>
                <blockquote className="text-sm text-slate-200 font-mono bg-slate-950/60 p-3 rounded border border-red-950 break-words">
                  &quot;{finding.evidence.adText}&quot;
                </blockquote>
              </div>
              <div className="mt-4 pt-3 border-t border-red-950/80 text-[11px] text-slate-400">
                Sursă detectată de agentul tehnic de colectare
              </div>
            </div>

            {/* Landing Box */}
            <div className="border border-indigo-900/50 bg-indigo-950/20 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
                  2. Realitate Landing Page
                </span>
                <blockquote className="text-sm text-slate-200 font-mono bg-slate-950/60 p-3 rounded border border-indigo-950 break-words whitespace-pre-line">
                  &quot;{finding.evidence.landingText}&quot;
                </blockquote>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-950/80 text-[11px] text-slate-400 truncate">
                URL: <a href={finding.evidence.landingUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{finding.evidence.landingUrl}</a>
              </div>
            </div>
          </div>

          {/* Captura reală a landing page-ului, cu locul exact al problemei încadrat */}
          {showCapture && (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 text-xs font-semibold text-slate-300">
                3. Unde apare pe landing page (captură realizată de scanner)
              </div>
              <div className="max-h-96 overflow-y-auto bg-white">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pageCapture}
                    alt="Captura landing page-ului"
                    className="block w-full h-auto"
                    onLoad={(e) => {
                      const box = e.currentTarget.parentElement?.parentElement;
                      if (box) box.scrollTop = Math.max(0, (focusY / 100) * box.scrollHeight - box.clientHeight / 2);
                    }}
                  />
                  {frames.map((fr, i) => (
                    <div
                      key={i}
                      className="absolute border-2 border-red-500 bg-red-500/10 rounded-sm shadow-[0_0_0_9999px_rgba(2,6,23,0.35)]"
                      style={{ left: `${fr.x}%`, top: `${fr.y}%`, width: `${fr.w}%`, height: `${fr.h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {finding.evidence.contextSnippet && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs text-slate-400 break-words">
              <span className="font-semibold text-slate-300 block mb-1">Dovadă context tehnic / DOM:</span>
              {finding.evidence.contextSnippet}
            </div>
          )}

          {/* AI Decision & Fix */}
          <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-indigo-300 mb-2">Raționament de remediere (AI Agent Rationale):</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{finding.aiSuggestedFix.rationale}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Închide Inspecția
          </button>
        </div>
      </div>
    </div>
  );
};
