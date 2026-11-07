/**
 * Run every technical check on one URL and save the results as a fixture folder.
 *
 *   npm run scan -- <url> [--name my-campaign] [--lighthouse] [--out fixtures]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from './browser.ts';
import { capturePage } from './checks/capturePage.ts';
import { checkAccessibility } from './checks/checkAccessibility.ts';
import { checkLinks } from './checks/checkLinks.ts';
import { checkPerformance } from './checks/checkPerformance.ts';
import { extractOffer } from './checks/extractOffer.ts';
import { runLighthouse } from './checks/lighthouse.ts';
import type { CheckResult, Finding } from './types.ts';

export interface ScanSummary {
  url: string;
  scannedAt: string;
  totalMs: number;
  modules: Record<string, { ok: boolean; error?: string; durationMs: number; findings: number }>;
  findings: Finding[];
}

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export async function scanUrl(url: string, outDir: string, opts: { lighthouse?: boolean } = {}): Promise<ScanSummary> {
  const t0 = Date.now();
  await mkdir(outDir, { recursive: true });
  const browser = await launchBrowser();
  const modules: ScanSummary['modules'] = {};
  const all: Finding[] = [];
  const record = async <T>(name: string, run: () => Promise<CheckResult<T>>, strip?: (d: T) => unknown) => {
    process.stdout.write(`  ${name.padEnd(20)} `);
    const r = await run();
    modules[name] = { ok: r.ok, error: r.error, durationMs: r.durationMs, findings: r.findings.length };
    all.push(...r.findings);
    const out = { ...r, data: r.data && strip ? strip(r.data) : r.data };
    await writeFile(path.join(outDir, `${name}.json`), JSON.stringify(out, null, 2));
    console.log(`${r.ok ? 'ok ' : 'ERR'} ${(r.durationMs / 1000).toFixed(1)}s  ${r.findings.length} findings${r.error ? '  — ' + r.error : ''}`);
    return r;
  };
  try {
    await record('capturePage', () => capturePage(url, { browser, outDir }), (d) => ({
      ...d,
      html: `(saved to page.html, ${d.html.length} chars)`,
      visibleText: `(saved to text.txt, ${d.visibleText.length} chars)`,
      desktop: { ...d.desktop, screenshot: undefined, screenshotFold: undefined },
      mobile: { ...d.mobile, screenshot: undefined, screenshotFold: undefined },
    }));
    await record('checkLinks', () => checkLinks(url, { browser }));
    await record('checkPerformance', () => checkPerformance(url, { browser }));
    await record('checkAccessibility', () => checkAccessibility(url, { browser }));
    await record('extractOffer', () => extractOffer(url, { browser }));
  } finally {
    await browser.close();
  }
  if (opts.lighthouse) {
    process.stdout.write(`  ${'lighthouse'.padEnd(20)} `);
    const lh = await runLighthouse(url);
    modules.lighthouse = { ok: lh.ok, error: lh.error, durationMs: lh.data?.durationMs ?? 0, findings: 0 };
    await writeFile(path.join(outDir, 'lighthouse.json'), JSON.stringify(lh, null, 2));
    console.log(lh.ok ? `ok  ${(lh.data!.durationMs / 1000).toFixed(1)}s  score ${lh.data!.performanceScore}` : `ERR ${lh.error}`);
  }
  all.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  const summary: ScanSummary = { url, scannedAt: new Date().toISOString(), totalMs: Date.now() - t0, modules, findings: all };
  await writeFile(path.join(outDir, 'findings.json'), JSON.stringify(all, null, 2));
  await writeFile(path.join(outDir, 'summary.json'), JSON.stringify({ ...summary, findings: undefined, findingCount: all.length }, null, 2));
  return summary;
}

function slug(url: string): string {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'page';
  } catch {
    return 'page';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const url = args.find((a) => !a.startsWith('--') && !['--name', '--out'].includes(args[args.indexOf(a) - 1]));
  if (!url) {
    console.error('Usage: npm run scan -- <url> [--name my-campaign] [--lighthouse] [--out fixtures]');
    process.exit(1);
  }
  const get = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
  const outDir = path.join(get('--out') ?? 'fixtures', get('--name') ?? slug(url));
  console.log(`Scanning ${url}\n  -> ${outDir}`);
  const s = await scanUrl(url, outDir, { lighthouse: args.includes('--lighthouse') });
  console.log(`\nDone in ${(s.totalMs / 1000).toFixed(1)}s — ${s.findings.length} findings`);
  for (const f of s.findings) console.log(`  [${f.severity.padEnd(8)}] ${f.category.padEnd(13)} ${f.title}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
