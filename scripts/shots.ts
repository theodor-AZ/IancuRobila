// Screenshot UI routes (desktop + mobile, dark + light) into ui/.shots/, and export brand PNGs.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const base = process.argv[2] ?? 'http://localhost:3100';
const routes = (process.argv[3] ?? '/,/scan/SCN-0042,/scan/new,/styleguide').split(',');
await mkdir('ui/.shots', { recursive: true });
const b = await chromium.launch();
for (const theme of ['dark', 'light']) {
  for (const [dev, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]] as const) {
    const ctx = await b.newContext({ viewport: vp, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('cgx-theme', t); } catch {} }, theme);
    const p = await ctx.newPage();
    for (const r of routes) {
      await p.goto(base + r, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      const name = (r === '/' ? 'home' : r.replace(/\//g, '_').replace(/^_/, '')) + `.${dev}.${theme}.png`;
      await p.screenshot({ path: `ui/.shots/${name}`, fullPage: true });
    }
    await ctx.close();
  }
}
if (process.argv.includes('--brand')) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 630 } });
  const p = await ctx.newPage();
  await p.goto(base + '/brand/og', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: 'ui/public/brand/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await p.screenshot({ path: 'ui/src/app/opengraph-image.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  const c2 = await b.newContext({ viewport: { width: 512, height: 512 } });
  const p2 = await c2.newPage();
  await p2.setContent(`<body style="margin:0;background:transparent"><img src="${base}/icon.svg" style="width:512px;height:512px;display:block"></body>`);
  await p2.waitForTimeout(500);
  await p2.screenshot({ path: 'ui/public/brand/claimguard-x-mark-512.png', omitBackground: true });
}
await b.close();
console.log('ok');
