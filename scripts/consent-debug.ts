// Check cookie-banner dismissal on a real site, mobile + desktop.
import { chromium } from 'playwright';
import { newContext, openPage } from '../src/browser.ts';
const url = process.argv[2] ?? 'https://www.nivea.ro/';
const b = await chromium.launch();
for (const dev of ['mobile', 'desktop'] as const) {
  const ctx = await newContext(b, dev);
  const r = await openPage(ctx, url);
  await r.page.waitForTimeout(800);
  await r.page.screenshot({ path: `probes/consent-${dev}.png` });
  console.log(dev, 'consentDismissed:', r.consentDismissed);
  await ctx.close();
}
await b.close();
