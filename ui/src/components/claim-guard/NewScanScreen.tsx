'use client';

import React, { useState } from 'react';
import { Shield, Sparkles, ArrowRight, AlertCircle, Loader2, FlaskConical } from 'lucide-react';

/** Ce trimite formularul către POST /api/scans (scannerul real). */
export interface NewScanInput {
  adText: string;
  landingUrl: string;
  productCategory: 'cosmetics' | 'general';
  adImage: File | null;
  documents: File[];
}

interface NewScanScreenProps {
  /** Pornește scanarea; aruncă o eroare cu mesaj pentru utilizator dacă serverul o refuză. */
  onStartScan: (input: NewScanInput) => Promise<void>;
}

/** Campaniile de test ale Colegului 4 (public/demo-campaigns), cu vulnerabilități plantate. */
const ROLE4_CAMPAIGNS = [
  { id: 'cosmetics', label: 'Velunara (cosmetice)' },
  { id: 'detergent', label: 'Mossmorrow (detergent)' },
  { id: 'store', label: 'Nookstitch (magazin)' },
  { id: 'control', label: 'Plainharbor (control, curat)' },
];

const DEMO_AD_TEXT =
  'GlowPure Hydra Cream. 48h hydration. Clinically proven. -50% this week only. 100% natural · eco-friendly packaging. Free delivery. Only today! Buy now';

async function fileFrom(url: string, name: string, type: string): Promise<File | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return new File([await r.blob()], name, { type });
  } catch {
    return null;
  }
}

/** Campania demo principală: brand inventat, landing page servit chiar de aplicație (public/demo-site). */
async function loadGlowPure(): Promise<NewScanInput> {
  return {
    adText: DEMO_AD_TEXT,
    landingUrl: `${window.location.origin}/demo-site/flawed-shop/index.html`,
    productCategory: 'cosmetics',
    adImage: await fileFrom('/demo/ad-glowpure.svg', 'ad-glowpure.svg', 'image/svg+xml'),
    documents: [],
  };
}

async function loadRole4(id: string): Promise<NewScanInput> {
  const base = `/demo-campaigns/${id}`;
  const md = await (await fetch(`${base}/ad-copy.md`)).text();
  // Textul reclamei fără marcajele Markdown.
  const adText = md
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  const [adImage, d1, d2] = await Promise.all([
    fileFrom(`${base}/artwork.svg`, `${id}-artwork.svg`, 'image/svg+xml'),
    fileFrom(`${base}/evidence-1.pdf`, `${id}-evidence-1.pdf`, 'application/pdf'),
    fileFrom(`${base}/evidence-2.pdf`, `${id}-evidence-2.pdf`, 'application/pdf'),
  ]);
  return {
    adText,
    landingUrl: `${window.location.origin}${base}/index.html`,
    productCategory: id === 'cosmetics' ? 'cosmetics' : 'general',
    adImage,
    documents: [d1, d2].filter((d): d is File => !!d),
  };
}

function validate(v: NewScanInput): string {
  if (v.adText.trim().length < 10) return 'Lipește textul reclamei (minim 10 caractere).';
  try {
    const u = new URL(v.landingUrl.trim());
    if (!/^https?:$/.test(u.protocol)) throw new Error();
  } catch {
    return 'Introdu adresa completă a landing page-ului, care începe cu https://';
  }
  if (v.adImage && !/^image\/(png|jpeg|webp|svg\+xml)$/.test(v.adImage.type)) return 'Imaginea trebuie să fie PNG, JPG, WebP sau SVG.';
  if (v.adImage && v.adImage.size > 10 * 1024 * 1024) return 'Imaginea are peste 10 MB.';
  if (v.documents.some((d) => d.type !== 'application/pdf')) return 'Documentele de dovezi trebuie să fie PDF.';
  if (v.documents.length > 5) return 'Încarcă cel mult 5 documente.';
  return '';
}

const EMPTY: NewScanInput = { adText: '', landingUrl: '', productCategory: 'general', adImage: null, documents: [] };

const inputClass =
  'w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 font-mono transition-colors';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2';
const fileClass =
  'w-full text-xs text-slate-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-slate-800 file:text-slate-200 file:text-xs file:font-medium hover:file:bg-slate-700 file:cursor-pointer';

export const NewScanScreen: React.FC<NewScanScreenProps> = ({ onStartScan }) => {
  const [v, setV] = useState<NewScanInput>(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  // Cheie pentru a reseta input-urile de fișier când se încarcă o campanie demo.
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(v);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onStartScan({ ...v, adText: v.adText.trim(), landingUrl: v.landingUrl.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scanarea nu a putut porni. Încearcă din nou.');
      setSubmitting(false);
    }
  };

  const fillDemo = async (id: string, load: () => Promise<NewScanInput>) => {
    setLoadingDemo(id);
    try {
      setV(await load());
      setFormKey((k) => k + 1);
      setError('');
    } catch {
      setError('Nu am putut încărca campania demo.');
    } finally {
      setLoadingDemo(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
          Lansează o Scanare Red Team
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Agentul AI compară promisiunile din reclamă cu realitatea din Landing Page pentru a preveni amenzile de reglementare.
        </p>
      </div>

      <form key={formKey} onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {error && (
          <div role="alert" className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="ad-text" className={labelClass}>
            1. Textul Reclamei (titlu, text, call to action)
          </label>
          <textarea
            id="ad-text"
            rows={4}
            value={v.adText}
            onChange={(e) => setV({ ...v, adText: e.target.value })}
            placeholder="Lipește textul exact cum apare în reclamă (Meta Ads, Google, TikTok, postare)..."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <label htmlFor="ad-image" className={labelClass}>
            Imaginea Reclamei (opțional)
          </label>
          <input
            id="ad-image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => setV({ ...v, adImage: e.target.files?.[0] ?? null })}
            className={fileClass}
          />
          {v.adImage && <p className="mt-1 text-[11px] font-mono text-slate-500">Încărcat: {v.adImage.name}</p>}
        </div>

        <div>
          <label htmlFor="landing-url" className={labelClass}>
            2. URL Landing Page Destinație
          </label>
          <input
            id="landing-url"
            type="url"
            value={v.landingUrl}
            onChange={(e) => setV({ ...v, landingUrl: e.target.value })}
            placeholder="https://magazinul-tau.ro/produs-oferta..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className={labelClass}>
              3. Categoria Produsului
            </label>
            <select
              id="category"
              value={v.productCategory}
              onChange={(e) => setV({ ...v, productCategory: e.target.value as NewScanInput['productCategory'] })}
              className={inputClass}
            >
              <option value="general">General</option>
              <option value="cosmetics">Cosmetice</option>
            </select>
          </div>
          <div>
            <label htmlFor="documents" className={labelClass}>
              4. Dovezi Produs (PDF, opțional)
            </label>
            <input
              id="documents"
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => setV({ ...v, documents: Array.from(e.target.files ?? []) })}
              className={fileClass}
            />
            {v.documents.length > 0 && (
              <p className="mt-1 text-[11px] font-mono text-slate-500 break-words">{v.documents.map((d) => d.name).join(', ')}</p>
            )}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fillDemo('glowpure', loadGlowPure)}
            disabled={!!loadingDemo || submitting}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono disabled:opacity-50"
          >
            {loadingDemo === 'glowpure' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Populează date demonstrative (Demo Hackathon)
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            <span>{submitting ? 'Se pornește...' : 'Pornește Scanarea'}</span>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* CAMPANIILE DE TEST ALE COLEGULUI 4 */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            Campanii de test (benchmark Colegul 4)
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLE4_CAMPAIGNS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => fillDemo(c.id, () => loadRole4(c.id))}
                disabled={!!loadingDemo || submitting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {loadingDemo === c.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
