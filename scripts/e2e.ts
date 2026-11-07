// End-to-end on the template UI: New scan → demo campaign → real scan → report → evidence inspection.
// Usage: npx tsx scripts/e2e.ts [baseUrl] [campaign button text, default "Populează date demonstrative"]
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:3000';
const demo = process.argv[3] ?? 'Populează date demonstrative';
const tag = demo.split(' ')[0].toLowerCase();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 300)));
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.screenshot({ path: `ui/.shots/t-0-demo-report.png`, fullPage: true });
await p.getByRole('button', { name: 'Scanare Nouă' }).click();
await p.getByRole('button', { name: new RegExp(demo) }).click();
await p.waitForFunction(() => (document.querySelector('#landing-url') as HTMLInputElement)?.value.length > 0);
await p.screenshot({ path: `ui/.shots/t-1-new-${tag}.png`, fullPage: true });
const t0 = Date.now();
await p.getByRole('button', { name: 'Pornește Scanarea' }).click();
await p.getByText('Scanare Tehnică în Desfășurare').waitFor({ timeout: 20000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: `ui/.shots/t-2-progress.png` });
await p.getByText('Raport de Conformitate').waitFor({ timeout: 180000 });
await p.waitForTimeout(1000);
console.log('report after', ((Date.now() - t0) / 1000).toFixed(1) + 's');
console.log('findings', await p.getByRole('button', { name: /Detalii complete/ }).count());
await p.screenshot({ path: `ui/.shots/t-3-report-${tag}.png`, fullPage: true });
// open the first finding that has a frame on the page capture
await p.getByRole('button', { name: /Detalii complete/ }).first().click();
await p.getByRole('button', { name: /Deschide Inspecție Dovezi/ }).first().click();
await p.waitForTimeout(1500);
await p.screenshot({ path: `ui/.shots/t-4-evidence-${tag}.png` });
console.log('capture in modal', await p.locator('img[alt="Captura landing page-ului"]').count());
await p.keyboard.press('Escape');
await p.goto(base + '/', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Istoric' }).click();
await p.waitForTimeout(1000);
await p.screenshot({ path: `ui/.shots/t-5-history.png`, fullPage: true });
await b.close();
