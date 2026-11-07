import { detectBlock, errorMessage, findingId, newContext, withBrowser, type ScanOptions } from '../browser.ts';
import type { CheckResult, Finding } from '../types.ts';

export interface PerformanceData {
  /** Largest Contentful Paint in ms (null if the browser did not report one). */
  lcpMs: number | null;
  /** Text / tag of the LCP element. */
  lcpElement: string | null;
  firstContentfulPaintMs: number | null;
  domContentLoadedMs: number | null;
  /** Time until the `load` event. */
  loadMs: number | null;
  transferKb: number;
  requests: number;
  throttled: boolean;
}

export interface PerformanceOptions extends ScanOptions {
  /** Simulate a mid-range phone on 4G (default true). Without it, numbers reflect your own connection. */
  throttle?: boolean;
  /** LCP thresholds in ms (default: Google Core Web Vitals, 2500 / 4000). */
  lcpGoodMs?: number;
  lcpPoorMs?: number;
  /** Flag total load above this (default 8000 ms). */
  loadSlowMs?: number;
}

/**
 * Mobile speed: LCP and total load time, measured in a real browser with network/CPU throttling.
 * Fast (a few seconds). For the full Lighthouse audit see runLighthouse() in lighthouse.ts.
 */
export async function checkPerformance(url: string, opts: PerformanceOptions = {}): Promise<CheckResult<PerformanceData>> {
  const t0 = Date.now();
  const throttle = opts.throttle ?? true;
  try {
    const data = await withBrowser(opts, async (browser) => {
      const ctx = await newContext(browser, 'mobile');
      try {
        await ctx.addInitScript(() => {
          (window as any).__cg = { lcp: null as number | null, lcpEl: null as string | null };
          try {
            new PerformanceObserver((list) => {
              for (const e of list.getEntries() as any[]) {
                (window as any).__cg.lcp = e.startTime;
                const el = e.element as Element | null;
                (window as any).__cg.lcpEl = el ? `<${el.tagName.toLowerCase()}> ${(el.textContent || (el as HTMLImageElement).src || '').trim().slice(0, 80)}` : null;
              }
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          } catch {}
        });
        const page = await ctx.newPage();
        if (throttle) {
          const cdp = await ctx.newCDPSession(page);
          await cdp.send('Network.enable');
          // Roughly Lighthouse's "Slow 4G" + 4x CPU slowdown.
          await cdp.send('Network.emulateNetworkConditions', {
            offline: false,
            latency: 150,
            downloadThroughput: (1.6 * 1024 * 1024) / 8,
            uploadThroughput: (750 * 1024) / 8,
          });
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        }
        let transfer = 0;
        let requests = 0;
        page.on('requestfinished', async (req) => {
          requests++;
          const sizes = await req.sizes().catch(() => null);
          if (sizes) transfer += sizes.responseBodySize + sizes.responseHeadersSize;
        });
        const response = await page.goto(url, { waitUntil: 'load', timeout: opts.timeoutMs ?? 60000 });
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        // Never report the speed of a bot-wall page as the speed of the landing page.
        const blocked = await detectBlock(page, response?.status() ?? null);
        if (blocked) throw new Error(`Page blocked: ${blocked}`);
        // LCP is finalized on first user input; a tiny scroll makes the browser report the final value.
        await page.mouse.wheel(0, 10).catch(() => {});
        await page.waitForTimeout(300);
        const m = await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          const cg = (window as any).__cg ?? {};
          return {
            lcpMs: cg.lcp ?? null,
            lcpElement: cg.lcpEl ?? null,
            firstContentfulPaintMs: fcp ? fcp.startTime : null,
            domContentLoadedMs: nav ? nav.domContentLoadedEventEnd : null,
            loadMs: nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : null,
          };
        });
        const round = (n: number | null) => (n === null ? null : Math.round(n));
        return {
          lcpMs: round(m.lcpMs),
          lcpElement: m.lcpElement,
          firstContentfulPaintMs: round(m.firstContentfulPaintMs),
          domContentLoadedMs: round(m.domContentLoadedMs),
          loadMs: round(m.loadMs),
          transferKb: Math.round(transfer / 1024),
          requests,
          throttled: throttle,
        } satisfies PerformanceData;
      } finally {
        await ctx.close();
      }
    });
    return { url, ok: true, durationMs: Date.now() - t0, findings: toFindings(url, data, opts), data };
  } catch (e) {
    return { url, ok: false, error: errorMessage(e), durationMs: Date.now() - t0, findings: [] };
  }
}

function toFindings(url: string, d: PerformanceData, opts: PerformanceOptions): Finding[] {
  const good = opts.lcpGoodMs ?? 2500;
  const poor = opts.lcpPoorMs ?? 4000;
  const slow = opts.loadSlowMs ?? 8000;
  const cond = d.throttled ? 'simulated mid-range phone on 4G' : 'unthrottled connection';
  const out: Finding[] = [];
  if (d.lcpMs !== null && d.lcpMs > good) {
    const isPoor = d.lcpMs > poor;
    out.push({
      id: findingId('perf', url, 'lcp'),
      category: 'conversion',
      severity: isPoor ? 'high' : 'medium',
      title: `Main content appears slowly on mobile (LCP ${(d.lcpMs / 1000).toFixed(1)} s)`,
      claim: d.lcpElement ?? 'Largest content element',
      evidence: { url, details: { lcpMs: d.lcpMs, lcpElement: d.lcpElement, thresholdGoodMs: good, thresholdPoorMs: poor, conditions: cond } },
      rule: 'Core Web Vitals: LCP ≤ 2.5 s is "good", > 4 s is "poor"',
      risk: 'Mobile visitors from the ad wait for the main content and many leave before seeing the offer.',
      fix: 'Compress and resize the hero image (WebP/AVIF), preload it, and defer non-critical scripts and trackers.',
      confidence: 0.8,
    });
  }
  if (d.loadMs !== null && d.loadMs > slow) {
    out.push({
      id: findingId('perf', url, 'load'),
      category: 'conversion',
      severity: 'medium',
      title: `Page takes ${(d.loadMs / 1000).toFixed(1)} s to fully load on mobile`,
      claim: 'Full page load',
      evidence: { url, details: { loadMs: d.loadMs, transferKb: d.transferKb, requests: d.requests, conditions: cond } },
      rule: null,
      risk: 'Heavy pages cost mobile visitors data and time, and slow down interaction.',
      fix: `Reduce page weight (${d.transferKb} KB in ${d.requests} requests): remove unused scripts, lazy-load below-the-fold images.`,
      confidence: 0.7,
    });
  }
  return out;
}
