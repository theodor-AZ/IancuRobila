/**
 * Scan every campaign folder and write one fixture folder per campaign.
 *
 *   npx tsx scripts/scan-campaigns.ts [campaignsDir=demo-campaigns] [outDir=fixtures]
 *
 * Each campaign is a subfolder; its landing page is the first of:
 *   <campaign>/landing/index.html, <campaign>/landing.html, <campaign>/index.html
 * The folder is served on a local port, so links/HTTP codes behave like a real site.
 */
import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { scanUrl } from '../src/scan.ts';
import { startServer } from '../src/serve.ts';

const dir = process.argv[2] ?? 'demo-campaigns';
const outRoot = process.argv[3] ?? 'fixtures';
const port = 4180;

const exists = (p: string) => access(p).then(() => true, () => false);

const server = await startServer(dir, port);
try {
  const entries = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory());
  for (const e of entries) {
    const candidates = ['landing/index.html', 'landing.html', 'index.html'];
    let rel: string | undefined;
    for (const c of candidates) if (await exists(path.join(dir, e.name, c))) { rel = c; break; }
    if (!rel) { console.log(`skip ${e.name}: no landing page found (${candidates.join(', ')})`); continue; }
    const url = `http://localhost:${port}/${e.name}/${rel.replace(/index\.html$/, '')}`;
    console.log(`\n${e.name}  ${url}`);
    const s = await scanUrl(url, path.join(outRoot, e.name));
    for (const f of s.findings) console.log(`  [${f.severity.padEnd(8)}] ${f.category.padEnd(13)} ${f.title}`);
  }
} finally {
  server.close();
}
