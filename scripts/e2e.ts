// End-to-end: fill the New scan form with the demo campaign, run a real scan, capture progress + report.
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:3000';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 300)));
await p.goto(base + '/scan/new', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Fill with demo campaign' }).click();
await p.waitForTimeout(800);
await p.screenshot({ path: 'ui/.shots/e2e-1-new-scan.png', fullPage: true });
const t0 = Date.now();
await p.getByRole('button', { name: 'Run Red Team scan' }).click();
await p.waitForURL(/\/progress$/, { timeout: 20000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: 'ui/.shots/e2e-2-progress.png' });
await p.waitForURL(/\/scan\/SCN-[A-Z0-9-]+$/, { timeout: 180000 });
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1500);
console.log('report', p.url(), ((Date.now() - t0) / 1000).toFixed(1) + 's');
await p.screenshot({ path: 'ui/.shots/e2e-3-report.png', fullPage: true });
// hover the discount row to show the linked frame
const row = p.locator('tbody').getByRole('button', { name: /Discount in the ad/ }).first();
await row.hover();
await p.waitForTimeout(500);
await p.locator('figure').nth(1).screenshot({ path: 'ui/.shots/e2e-4-linked-frame.png' });
console.log('findings rows', await p.locator('tbody tr').count());
await b.close();
