'use client';

import React, { useState } from 'react';
import { Finding } from '@/types/finding';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Sparkles
} from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  onInspectEvidence?: (finding: Finding) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onInspectEvidence }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopyFix = () => {
    navigator.clipboard.writeText(finding.aiSuggestedFix.suggestedClaim);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const severityBadge = (severity: Finding['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/80">
            <AlertOctagon className="w-3.5 h-3.5" /> CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/80 text-orange-400 border border-orange-800/80">
            <AlertTriangle className="w-3.5 h-3.5" /> HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <Info className="w-3.5 h-3.5" /> MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <CheckCircle className="w-3.5 h-3.5" /> LOW
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5 flex-wrap">
          {severityBadge(finding.severity)}
          <span className="text-xs uppercase tracking-wider font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
            {finding.category.replace('_', ' ')}
          </span>
          {finding.ruleId && (
            <span className="text-xs font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-900/60 px-2 py-0.5 rounded">
              {finding.ruleId}
            </span>
          )}
          <h3 className="text-base font-semibold text-slate-100">{finding.title}</h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 self-end md:self-auto cursor-pointer"
        >
          {isExpanded ? 'Mai puține detalii' : 'Detalii complete'}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-sm text-slate-300 mt-3 leading-relaxed">
        {finding.riskDescription}
      </p>

      {finding.regulatoryReference && (
        <div className="mt-2 text-xs font-mono text-amber-400/90 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          Referință legală: {finding.regulatoryReference}
        </div>
      )}

      {/* BEFORE / AFTER REMEDIATION VIEW */}
      <div className="mt-4 bg-slate-950/80 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            AI Compliance Remediation (Before / After)
          </div>
          <button
            onClick={handleCopyFix}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/40 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiat!' : 'Copy Fix'}</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="bg-red-950/30 border border-red-900/40 rounded p-2 text-red-300/90">
            <span className="font-semibold text-red-400 block mb-0.5">ORIGINAL (PROMISIUNE CU RISC):</span>
            <span className="line-through opacity-80 break-words">{finding.aiSuggestedFix.originalClaim}</span>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded p-2 text-emerald-300/90">
            <span className="font-semibold text-emerald-400 block mb-0.5">PROPUNERE CONFORMĂ (AI FIX):</span>
            <span>{finding.aiSuggestedFix.suggestedClaim}</span>
          </div>
        </div>
      </div>

      {/* EXPANDABLE EVIDENCE PREVIEW */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 font-medium block mb-1">Ad Copy Sursă ({finding.evidence.adSource}):</span>
              <p className="text-slate-200 italic font-mono text-[11px] break-words">&quot;{finding.evidence.adText}&quot;</p>
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded border border-slate-800">
              <span className="text-slate-400 font-medium block mb-1">Landing Page Reality:</span>
              <p className="text-slate-200 italic font-mono text-[11px] break-words whitespace-pre-line">&quot;{finding.evidence.landingText}&quot;</p>
            </div>
          </div>

          {finding.evidence.contextSnippet && (
            <p className="text-slate-400 italic break-words">
              Context: {finding.evidence.contextSnippet}
            </p>
          )}

          {onInspectEvidence && (
            <button
              onClick={() => onInspectEvidence(finding)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Deschide Inspecție Dovezi (Ad vs Landing Page)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
