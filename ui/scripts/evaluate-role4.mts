/**
 * Benchmark the app on Colleague 4's demo campaigns with his evaluator (role4/evaluation/evaluate.ts).
 * Needs the app running (npm run dev). The scanner never sees ground truth or matching criteria:
 * it gets each campaign's ad copy, artwork, landing URL and evidence PDFs, like a user would.
 *
 *   npx tsx scripts/evaluate-role4.mts [baseUrl=http://localhost:3000] [outDir=../role4/reports/claimguard-run]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { evaluate, markdown, readJson } from '../../role4/evaluation/evaluate.ts';
import type { Finding as R4Finding, ScannerOutput } from '../../role4/lib/contracts.ts';
import type { Finding, Scan } from '../src/lib/types.ts';

const base = process.argv[2] ?? 'http://localhost:3000';
const outDir = path.resolve(process.argv[3] ?? '../role4/reports/claimguard-run');
const R4 = path.resolve('../role4/demo-campaigns');
const manifest: { id: string }[] = readJson('demo-campaigns/manifest.json');

const plain = (md: string) => md.replace(/^#+\s*/gm, '').replace(/[*_`>]/g, '').replace(/^\s*[-•]\s+/gm, '').replace(/\n{2,}/g, '\n').trim();

async function scanCampaign(id: string): Promise<Scan> {
  const form = new FormData();
  form.set('adText', plain(await readFile(path.join(R4, id, 'ad-copy.md'), 'utf8')));
  form.set('landingUrl', `${base}/demo-campaigns/${id}/index.html`);
  form.set('productCategory', id === 'cosmetics' ? 'cosmetics' : 'general');
  form.set('adImage', new File([await readFile(path.join(R4, id, 'artwork.svg'))], `${id}.svg`, { type: 'image/svg+xml' }));
  for (const d of ['evidence-1.pdf', 'evidence-2.pdf']) {
    form.append('documents', new File([await readFile(path.join(R4, id, d))], `${id}-${d}`, { type: 'application/pdf' }));
  }
  const r = await fetch(`${base}/api/scans`, { method: 'POST', body: form });
  const { id: scanId, error } = (await r.json()) as { id?: string; error?: string };
  if (!scanId) throw new Error(`${id}: ${error}`);
  for (let i = 0; i < 180; i++) {
    await new Promise((res) => setTimeout(res, 1000));
    const s = (await (await fetch(`${base}/api/scans/${scanId}`)).json()) as Scan;
    if (s.status === 'done') return s;
    if (s.status === 'blocked' || s.status === 'failed') throw new Error(`${id}: ${s.error}`);
  }
  throw new Error(`${id}: timeout`);
}

/** App Finding → Colleague 4's ten-field Finding (evidence and rule as strings). */
function toR4(f: Finding): R4Finding {
  const e = f.evidence;
  return {
    id: f.id,
    category: f.category,
    severity: f.severity,
    title: f.title,
    claim: f.claim || f.title,
    evidence: [e.snippet, e.selector, e.document, e.url].filter(Boolean).join(' | ') || f.title,
    rule: f.ruleId ?? f.rule ?? 'UNMAPPED',
    risk: f.risk,
    fix: f.fix,
    confidence: f.confidence,
  };
}

const output: ScannerOutput = { campaigns: [] };
const scans: Record<string, string> = {};
for (const { id } of manifest) {
  process.stdout.write(`scanning ${id}… `);
  const s = await scanCampaign(id);
  scans[id] = s.id;
  output.campaigns.push({ campaignId: id, findings: s.findings.map(toR4) });
  console.log(`${s.findings.length} findings (${s.id}, ${(s.durationMs / 1000).toFixed(1)} s)`);
}

const result = evaluate(output, readJson('evaluation/ground-truth.json'), readJson('evaluation/matching.json'), manifest.map((c) => c.id));
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'scanner-output.json'), JSON.stringify(output, null, 2));
await writeFile(path.join(outDir, 'report.json'), JSON.stringify({ ...result, scans, scannedAt: new Date().toISOString() }, null, 2));
await writeFile(path.join(outDir, 'report.md'), markdown(result));
console.log('\n' + markdown(result));
