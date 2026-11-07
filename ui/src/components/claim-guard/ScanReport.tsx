'use client';

import React, { useState } from 'react';
import { Scan, Finding } from '@/types/finding';
import { FindingCard } from './FindingCard';
import { EvidenceView } from './EvidenceView';
import {
  ShieldCheck,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';

// Locale și fus orar fixe: serverul și browserul trebuie să afișeze exact același text,
// altfel React vede o nepotrivire la hidratare și redesenează pagina (resetând tab-ul activ).
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest' });

interface ScanReportProps {
  scan: Scan;
  findings: Finding[];
}

export const ScanReport: React.FC<ScanReportProps> = ({ scan, findings }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [inspectingFinding, setInspectingFinding] = useState<Finding | null>(null);
  const [showCleanStateToggle, setShowCleanStateToggle] = useState<boolean>(false);

  // Comutatorul „Clean 100%” e doar pentru datele demonstrative; la o scanare reală ar arăta un scor fals.
  const cleanState = !!scan.isDemo && showCleanStateToggle;

  // Filtrare vulnerabilități
  const effectiveFindings = cleanState ? [] : findings;
  const filteredFindings = effectiveFindings.filter((f) => {
    if (selectedSeverity === 'all') return true;
    return f.severity === selectedSeverity;
  });

  const displayScore = cleanState ? 98 : scan.score;

  // Calcul culoare cerc scor
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500';
    if (score >= 50) return 'text-amber-400 border-amber-500';
    return 'text-red-400 border-red-500';
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono uppercase bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
              Auditat de Red Team AI
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Scan ID: {scan.id}
            </span>
            {scan.isDemo && (
              <span className="text-xs font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                Date demonstrative
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Raport de Conformitate & Securitate Marketing
          </h1>
          {scan.campaign && (
            <p className="text-sm font-semibold text-indigo-300 mt-1">{scan.campaign}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
            <span>Ad: <strong className="text-slate-300 font-mono">{scan.adUrl}</strong></span>
            <span className="break-all">Landing: <strong className="text-slate-300 font-mono">{scan.landingUrl}</strong></span>
            {scan.documents && scan.documents.length > 0 && (
              <span>Dovezi: <strong className="text-slate-300 font-mono">{scan.documents.join(', ')}</strong></span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto print:hidden">
          {/* TOGGLE PENTRU PREZENTARE DEMO (STARE CURATĂ) */}
          {scan.isDemo && (
            <button
              onClick={() => setShowCleanStateToggle(!showCleanStateToggle)}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Comută pentru a arăta starea fără vulnerabilități la demo"
            >
              <Layers className="w-3.5 h-3.5" />
              {showCleanStateToggle ? 'Vezi Raportul cu Erori' : 'Simulează "Clean 100%"'}
            </button>
          )}

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Raport PDF
          </button>
        </div>
      </div>

      {/* KPI & SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* SCORE RING CARD */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
              Scor Conformitate
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {displayScore >= 80 ? 'Risc Scăzut' : displayScore >= 50 ? 'Risc Mediu' : 'Risc Critic'}
            </span>
          </div>
          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-extrabold text-xl ${getScoreColor(displayScore)}`}>
            {displayScore}%
          </div>
        </div>

        {/* METRICS COUNT */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Critice & High</span>
          <div className="text-2xl font-bold text-red-400 mt-2">
            {cleanState ? 0 : scan.findingsCount.critical + scan.findingsCount.high}
          </div>
          <span className="text-[11px] text-slate-500">Necesită remediere imediată</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Medium & Low</span>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {cleanState ? 0 : scan.findingsCount.medium + scan.findingsCount.low}
          </div>
          <span className="text-[11px] text-slate-500">Discrepanțe de formulare</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status Scanare</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm mt-2">
            <CheckCircle2 className="w-4 h-4" /> Finalizat cu succes
          </div>
          <span className="text-[11px] text-slate-500">Scanat la {formatTime(scan.createdAt)}</span>
        </div>
      </div>

      {/* VERIFICĂRI CARE NU AU PUTUT RULA */}
      {scan.warnings && scan.warnings.length > 0 && (
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300/90 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <AlertCircle className="w-4 h-4" /> Verificări care nu au putut rula (raportul poate fi incomplet):
          </div>
          {scan.warnings.map((w) => (
            <p key={w} className="font-mono break-words">{w}</p>
          ))}
        </div>
      )}

      {/* FILTRE DE SEVERITATE */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filtrează după gravitate:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedSeverity === sev
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {sev.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE VULNERABILITĂȚI / STARE CURATĂ */}
      {cleanState || filteredFindings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
          <ShieldCheck className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-100">
            {selectedSeverity !== 'all' && effectiveFindings.length > 0
              ? `Nicio vulnerabilitate de nivel ${selectedSeverity.toUpperCase()}.`
              : 'Nu au fost detectate vulnerabilități critice!'}
          </h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            {selectedSeverity !== 'all' && effectiveFindings.length > 0
              ? 'Alege alt filtru de gravitate pentru a vedea restul vulnerabilităților.'
              : 'Toate afirmațiile din reclamă se verifică pe landing page. Niciun risc de reglementare găsit conform Directivelor UE.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              onInspectEvidence={(f) => setInspectingFinding(f)}
            />
          ))}
        </div>
      )}

      {/* POPUP PENTRU INSPECȚIE DOVEZI */}
      <EvidenceView
        finding={inspectingFinding}
        onClose={() => setInspectingFinding(null)}
        pageCapture={scan.pageCapture}
      />
    </div>
  );
};
