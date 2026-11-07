'use client';

import React from 'react';
import { Scan } from '@/types/finding';
import { History, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';

interface ScanHistoryScreenProps {
  scans: Scan[];
  onSelectScan: (scanId: string) => void;
}

export const ScanHistoryScreen: React.FC<ScanHistoryScreenProps> = ({ scans, onSelectScan }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Istoric Scanări & Audituri
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Istoricul verificărilor automate de conformitate derulate
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {scans.map((scan) => {
          const isCompliant = scan.score >= 80;
          return (
            <button
              type="button"
              key={scan.id}
              onClick={() => onSelectScan(scan.id)}
              className="w-full text-left bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-slate-800/60"
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-200">{scan.campaign || scan.id}</span>
                  {scan.isDemo && (
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Demo
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">
                    {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 truncate">
                  Landing: <span className="font-mono text-slate-300">{scan.landingUrl}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {scan.status === 'completed' ? (
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Scor</span>
                    <span className={`text-sm font-bold ${isCompliant ? 'text-emerald-400' : 'text-red-400'}`}>
                      {scan.score}%
                    </span>
                  </div>
                ) : scan.status === 'failed' ? (
                  <span className="text-xs font-medium text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Eșuată
                  </span>
                ) : (
                  <span className="text-xs font-medium text-indigo-300 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> În curs
                  </span>
                )}

                <div className="hidden sm:flex gap-1 text-xs">
                  {scan.findingsCount.critical > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">
                      {scan.findingsCount.critical} Critice
                    </span>
                  )}
                  {scan.findingsCount.high > 0 && (
                    <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-900">
                      {scan.findingsCount.high} High
                    </span>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
