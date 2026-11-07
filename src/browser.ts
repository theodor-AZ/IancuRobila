import { chromium, devices, type Browser, type BrowserContext, type Page, type Response } from 'playwright';

export const MOBILE_VIEWPORT = { width: 390, height: 844 };
export const DESKTOP_VIEWPORT = { width: 1366, height: 900 };

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

export type Device = 'mobile' | 'desktop';

export interface ScanOptions {
  /** Reuse an already launched browser (faster when running several checks). */
  browser?: Browser;
  /** Navigation timeout in ms (default 30000). */
  timeoutMs?: number;
}

/**
 * Launch headless Chromium. We do not try to get around bot protection: pages behind a
 * bot wall are reported as blocked (see detectBlock) and the user is asked to allowlist us
 * or scan a page they control.
 */
export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

/** Run `fn` with the provided browser, or launch (and close) one just for this call. */
export async function withBrowser<T>(opts: ScanOptions | undefined, fn: (b: Browser) => Promise<T>): Promise<T> {
  if (opts?.browser) return fn(opts.browser);
  const browser = await launchBrowser();
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

export async function newContext(browser: Browser, device: Device): Promise<BrowserContext> {
  const base = device === 'mobile'
    ? { ...devices['Pixel 7'], viewport: MOBILE_VIEWPORT, userAgent: MOBILE_UA }
    : { viewport: DESKTOP_VIEWPORT, userAgent: DESKTOP_UA };
  const ctx = await browser.newContext({
    ...base,
    locale: 'en-US',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9,ro;q=0.8' },
    ignoreHTTPSErrors: true,
  });
  // tsx/esbuild wraps named functions with __name(); functions passed to page.evaluate need it in the page too.
  await ctx.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((f) => f);' });
  return ctx;
}

export interface OpenResult {
  page: Page;
  response: Response | null;
  status: number | null;
  finalUrl: string;
  loadMs: number;
  consentDismissed: boolean;
  /** Non-null when the page looks like a bot wall / error page. */
  blocked: string | null;
}

/**
 * Navigate robustly: wait for `load`, then give the network a short chance to go idle
 * (many marketing pages never reach networkidle because of trackers), then try to
 * dismiss cookie banners.
 */
export async function openPage(ctx: BrowserContext, url: string, timeoutMs = 30000): Promise<OpenResult> {
  const page = await ctx.newPage();
  const t0 = Date.now();
  const response = await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  const loadMs = Date.now() - t0;
  const consentDismissed = await dismissConsent(page);
  if (consentDismissed) await page.waitForTimeout(600);
  const status = response?.status() ?? null;
  const blocked = await detectBlock(page, status);
  return { page, response, status, finalUrl: page.url(), loadMs, consentDismissed, blocked };
}

const CONSENT_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '#CybotCookiebotDialogBodyButtonAccept',
  '#didomi-notice-agree-button',
  '.fc-cta-consent',
  'button[data-testid="uc-accept-all-button"]',
  '#truste-consent-button',
  '.cc-allow',
  '.cky-btn-accept',
  '#accept-cookies',
];

const CONSENT_TEXT =
  /^\s*(accept( all| toate)?( cookies)?|allow all( cookies)?|agree|i agree|got it|ok(ay)?|accept[aă] (tot|toate)( cookie-urile)?|sunt de acord|de acord|am în?țeles|permite (tot|toate))\s*$/i;

/** Best-effort cookie banner dismissal in the main frame and iframes. Returns true if something was clicked. */
export async function dismissConsent(page: Page): Promise<boolean> {
  for (const frame of page.frames()) {
    for (const sel of CONSENT_SELECTORS) {
      const el = frame.locator(sel).first();
      if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
        if (await el.click({ timeout: 2000 }).then(() => true).catch(() => false)) return true;
      }
    }
  }
  for (const frame of page.frames()) {
    const candidates = frame.locator('button, [role="button"], a');
    const n = Math.min(await candidates.count().catch(() => 0), 200);
    for (let i = 0; i < n; i++) {
      const el = candidates.nth(i);
      const text = (await el.innerText({ timeout: 200 }).catch(() => '')).trim();
      if (text.length > 40 || !CONSENT_TEXT.test(text)) continue;
      if (!(await el.isVisible().catch(() => false))) continue;
      if (await el.click({ timeout: 2000 }).then(() => true).catch(() => false)) return true;
    }
  }
  return false;
}

const BLOCK_TITLE = /just a moment|attention required|access denied|are you a robot|captcha|request blocked|forbidden|pardon our interruption|verify you are human/i;

export async function detectBlock(page: Page, status: number | null): Promise<string | null> {
  const title = await page.title().catch(() => '');
  if (BLOCK_TITLE.test(title)) return `bot wall (title: "${title}")`;
  if (status === 403 || status === 429 || status === 503) {
    const len = await page.evaluate(() => document.body?.innerText.length ?? 0).catch(() => 0);
    if (len < 2000) return `HTTP ${status} with almost empty page`;
  }
  const hasCaptcha = await page
    .locator('iframe[src*="captcha"], iframe[src*="challenges.cloudflare.com"], #px-captcha, .g-recaptcha')
    .count()
    .catch(() => 0);
  if (hasCaptcha > 0) return 'captcha present on page';
  return null;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message.split('\n')[0] : String(e);
}

/** Short stable id for findings: <prefix>-<hash of parts>. */
export function findingId(prefix: string, ...parts: string[]): string {
  let h = 5381;
  for (const ch of parts.join('|')) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0;
  return `${prefix}-${h.toString(36)}`;
}

export function truncate(s: string, n = 300): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}
