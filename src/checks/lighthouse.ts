import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { errorMessage } from '../browser.ts';

export interface LighthouseData {
  performanceScore: number | null;
  lcpMs: number | null;
  fcpMs: number | null;
  tbtMs: number | null;
  cls: number | null;
  speedIndexMs: number | null;
  durationMs: number;
}

/**
 * Full Lighthouse mobile performance audit. Slow (20–60 s+), so run it on demand only.
 * Uses the installed Chrome if found, otherwise Playwright's Chromium.
 */
export async function runLighthouse(url: string): Promise<{ ok: boolean; error?: string; data?: LighthouseData }> {
  const t0 = Date.now();
  let chrome: chromeLauncher.LaunchedChrome | undefined;
  try {
    let chromePath: string | undefined;
    try { chromePath = chromeLauncher.getChromePath(); } catch { chromePath = chromium.executablePath(); }
    chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] });
    const result = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] });
    if (!result) throw new Error('Lighthouse returned no result');
    const a = result.lhr.audits;
    const num = (id: string) => (typeof a[id]?.numericValue === 'number' ? Math.round(a[id].numericValue!) : null);
    return {
      ok: true,
      data: {
        performanceScore: result.lhr.categories.performance?.score != null ? Math.round(result.lhr.categories.performance.score * 100) : null,
        lcpMs: num('largest-contentful-paint'),
        fcpMs: num('first-contentful-paint'),
        tbtMs: num('total-blocking-time'),
        cls: typeof a['cumulative-layout-shift']?.numericValue === 'number' ? Number(a['cumulative-layout-shift'].numericValue!.toFixed(3)) : null,
        speedIndexMs: num('speed-index'),
        durationMs: Date.now() - t0,
      },
    };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  } finally {
    await chrome?.kill();
  }
}
