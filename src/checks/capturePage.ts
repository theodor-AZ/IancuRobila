import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { errorMessage, newContext, openPage, withBrowser, type Device, type ScanOptions } from '../browser.ts';
import type { CheckResult } from '../types.ts';

export interface DeviceCapture {
  device: Device;
  viewport: { width: number; height: number };
  status: number | null;
  finalUrl: string;
  loadMs: number;
  consentDismissed: boolean;
  blocked: string | null;
  /** Full-page PNG. */
  screenshot: Buffer;
  /** Above-the-fold PNG (what the visitor sees first). */
  screenshotFold: Buffer;
  /** Set when `outDir` was given. */
  screenshotPath?: string;
  screenshotFoldPath?: string;
}

export interface PageCapture {
  title: string;
  lang: string | null;
  metaDescription: string | null;
  /** h1–h3 in document order. */
  headings: { level: number; text: string }[];
  /** Text visible in the first mobile screen — useful for "does the main message say what you get?". */
  aboveFoldText: string;
  /** Rendered HTML (after JS), from the desktop capture. */
  html: string;
  /** Visible text (innerText of body), from the desktop capture. */
  visibleText: string;
  desktop: DeviceCapture;
  mobile: DeviceCapture;
}

export interface CaptureOptions extends ScanOptions {
  /** If set, writes desktop/mobile PNGs, page.html and text.txt there. */
  outDir?: string;
  /** Full-page screenshots are capped to this height in px (default 12000) to avoid huge files. */
  maxHeight?: number;
}

/** Desktop + mobile screenshots, rendered HTML and visible text, ready to send to the model. */
export async function capturePage(url: string, opts: CaptureOptions = {}): Promise<CheckResult<PageCapture>> {
  const t0 = Date.now();
  try {
    const data = await withBrowser(opts, async (browser) => {
      const desktop = await captureDevice(browser, url, 'desktop', opts);
      const mobile = await captureDevice(browser, url, 'mobile', opts);

      if (opts.outDir) {
        await mkdir(opts.outDir, { recursive: true });
        for (const c of [desktop.cap, mobile.cap]) {
          c.screenshotPath = `capture.${c.device}.png`;
          c.screenshotFoldPath = `capture.${c.device}.fold.png`;
          await writeFile(path.join(opts.outDir, c.screenshotPath), c.screenshot);
          await writeFile(path.join(opts.outDir, c.screenshotFoldPath), c.screenshotFold);
        }
        await writeFile(path.join(opts.outDir, 'page.html'), desktop.html);
        await writeFile(path.join(opts.outDir, 'text.txt'), desktop.visibleText);
      }

      return {
        title: desktop.title,
        lang: desktop.lang,
        metaDescription: desktop.metaDescription,
        headings: desktop.headings,
        aboveFoldText: mobile.aboveFoldText,
        html: desktop.html,
        visibleText: desktop.visibleText,
        desktop: desktop.cap,
        mobile: mobile.cap,
      } satisfies PageCapture;
    });
    const blocked = data.desktop.blocked ?? data.mobile.blocked;
    return { url, ok: !blocked, error: blocked ?? undefined, durationMs: Date.now() - t0, findings: [], data };
  } catch (e) {
    return { url, ok: false, error: errorMessage(e), durationMs: Date.now() - t0, findings: [] };
  }
}

async function captureDevice(browser: import('playwright').Browser, url: string, device: Device, opts: CaptureOptions) {
  const ctx = await newContext(browser, device);
  try {
    const r = await openPage(ctx, url, opts.timeoutMs);
    const { page } = r;
    // Trigger lazy-loaded images by scrolling through the page, then back to top.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      const max = Math.min(document.documentElement.scrollHeight, 12000);
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((res) => setTimeout(res, 120));
      }
      window.scrollTo(0, 0);
    }).catch(() => {});
    await page.waitForTimeout(300);

    const viewport = page.viewportSize() ?? { width: 0, height: 0 };
    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight).catch(() => viewport.height);
    const maxHeight = opts.maxHeight ?? 12000;
    const screenshot = fullHeight > maxHeight
      ? await page.screenshot({ clip: { x: 0, y: 0, width: viewport.width, height: maxHeight }, fullPage: true })
      : await page.screenshot({ fullPage: true });
    const screenshotFold = await page.screenshot({ fullPage: false });

    const info = await page.evaluate(() => {
      const vh = window.innerHeight;
      const headings = [...document.querySelectorAll('h1, h2, h3')]
        .map((h) => ({ level: Number(h.tagName[1]), text: (h as HTMLElement).innerText.trim() }))
        .filter((h) => h.text)
        .slice(0, 40);
      // Text of visible leaf-ish elements whose top is within the first screen.
      const parts: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const t = node.textContent?.trim();
        const el = node.parentElement;
        if (!t || !el) continue;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        if (r.top < vh && r.bottom > 0 && r.width > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05) {
          parts.push(t);
        }
      }
      return {
        title: document.title,
        lang: document.documentElement.getAttribute('lang'),
        metaDescription: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
        headings,
        aboveFoldText: parts.join(' ').replace(/\s+/g, ' ').slice(0, 3000),
        visibleText: document.body?.innerText ?? '',
      };
    });
    const html = await page.content();

    const cap: DeviceCapture = {
      device,
      viewport,
      status: r.status,
      finalUrl: r.finalUrl,
      loadMs: r.loadMs,
      consentDismissed: r.consentDismissed,
      blocked: r.blocked,
      screenshot,
      screenshotFold,
    };
    return { cap, html, ...info };
  } finally {
    await ctx.close();
  }
}
