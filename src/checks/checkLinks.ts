import type { APIRequestContext } from 'playwright';
import { errorMessage, findingId, newContext, openPage, truncate, withBrowser, type ScanOptions } from '../browser.ts';
import type { CheckResult, Finding } from '../types.ts';

export interface LinkCheck {
  text: string;
  href: string | null;
  /** Absolute URL that was requested (null for dead buttons / non-http links). */
  url: string | null;
  isCta: boolean;
  aboveFold: boolean;
  selector: string;
  status: number | null;
  /** URLs visited while following redirects (first = url). */
  redirectChain: string[];
  finalUrl: string | null;
  error?: string;
  /** 'unverified' = another site refused our automated request (e.g. Facebook's 400); no finding is raised. */
  problem?: 'broken' | 'redirect-chain' | 'no-destination' | 'unreachable' | 'unverified';
}

export interface LinksData {
  pageUrl: string;
  totalLinksOnPage: number;
  checked: LinkCheck[];
  usesJsFramework: boolean;
}

export interface CheckLinksOptions extends ScanOptions {
  /** Max distinct URLs to request (default 60). CTAs are always checked first. */
  maxLinks?: number;
  /** Also check links to other domains (default: only CTAs on other domains). */
  includeExternal?: boolean;
}

const CTA_TEXT =
  /\b(buy|shop|order|add to (cart|bag|basket)|checkout|get( it| started| yours| now)?|start|sign ?up|subscribe|try|book|claim|download|join|learn more|see offer|discover|cump[aă]r[aă]|comand[aă]|adaug[aă] [iî]n co[sș]|[iî]ncearc[aă]|descoper[aă]|vezi oferta|profit[aă]|rezerv[aă]|abonea?z[aă]|afl[aă] mai mult)\b/i;
const CTA_CLASS = /\b(btn|button|cta|primary|buy|add-to-cart|checkout)\b/i;
const SOCIAL = /^(facebook|instagram|youtube|tiktok|twitter|x|linkedin|pinterest|whatsapp|telegram)$/i;
/** Statuses that external sites commonly return to automated clients; not proof the link is broken. */
const BOT_STATUSES = new Set([400, 401, 403, 405, 429, 999]);

/** Links & CTAs: HTTP status of every main button/link; flags 404s, redirect chains and buttons with no destination. */
export async function checkLinks(url: string, opts: CheckLinksOptions = {}): Promise<CheckResult<LinksData>> {
  const t0 = Date.now();
  try {
    const data = await withBrowser(opts, async (browser) => {
      const ctx = await newContext(browser, 'desktop');
      try {
        const { page, finalUrl, blocked } = await openPage(ctx, url, opts.timeoutMs);
        if (blocked) throw new Error(`Page blocked: ${blocked}`);

        const raw = await page.evaluate(() => {
          const vh = window.innerHeight;
          const cssPath = (el: Element): string => {
            if (el.id) return `#${CSS.escape(el.id)}`;
            const parts: string[] = [];
            let cur: Element | null = el;
            while (cur && cur !== document.body && parts.length < 5) {
              let part = cur.tagName.toLowerCase();
              const parent: Element | null = cur.parentElement;
              if (parent) {
                const same = [...parent.children].filter((c) => c.tagName === cur!.tagName);
                if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
              }
              parts.unshift(part);
              cur = parent;
            }
            return parts.join(' > ');
          };
          const els = [...document.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]')];
          return {
            total: els.length,
            items: els
              .map((el) => {
                const h = el as HTMLElement;
                const r = h.getBoundingClientRect();
                const s = getComputedStyle(h);
                const visible = r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
                const text = (h.innerText || h.getAttribute('aria-label') || (h as HTMLInputElement).value || h.getAttribute('title') || '').trim();
                return {
                  tag: h.tagName.toLowerCase(),
                  text: text.slice(0, 120),
                  href: h.tagName === 'A' ? h.getAttribute('href') : null,
                  absHref: h.tagName === 'A' ? (h as HTMLAnchorElement).href : null,
                  className: typeof h.className === 'string' ? h.className : '',
                  hasOnclick: h.hasAttribute('onclick'),
                  inForm: !!h.closest('form'),
                  type: h.getAttribute('type'),
                  visible,
                  aboveFold: visible && r.top < vh && r.bottom > 0,
                  area: r.width * r.height,
                  selector: cssPath(h),
                };
              })
              .filter((x) => x.visible),
            usesJsFramework: !!(
              document.querySelector('#__next, [data-reactroot], [ng-version], #__nuxt, [data-v-app], #root, #app') ||
              (window as any).__NEXT_DATA__ || (window as any).React || (window as any).Vue
            ),
          };
        });

        const pageOrigin = new URL(finalUrl).origin;
        const items = raw.items.map((x) => {
          const text = x.text.replace(/\s+/g, ' ').trim();
          const isCta = !SOCIAL.test(text) && (
            CTA_TEXT.test(text) ||
            (CTA_CLASS.test(x.className) && x.aboveFold && text.length > 0 && text.length < 40)
          );
          return { ...x, text, isCta };
        });

        const results: LinkCheck[] = [];

        // 1) CTA anchors with no destination. <button>s are skipped on purpose: they almost always
        //    rely on JS handlers (often delegated, invisible to us), so flagging them is mostly noise.
        for (const x of items) {
          if (!x.isCta || x.tag !== 'a') continue;
          const h = (x.href ?? '').trim();
          const deadAnchor = x.href === null || h === '' || h === '#' || /^javascript:\s*(void\(0\)|;)?\s*;?$/i.test(h);
          if (!deadAnchor) continue;
          const listeners = await ownListenerCount(page, x.selector);
          if (listeners > 0 || x.hasOnclick) continue;
          results.push({
            text: x.text, href: x.href, url: null, isCta: true, aboveFold: x.aboveFold, selector: x.selector,
            status: null, redirectChain: [], finalUrl: null, problem: 'no-destination',
          });
        }

        // 2) HTTP links: CTAs first, then same-origin, optionally external.
        const seen = new Map<string, LinkCheck>();
        const queue = items
          .filter((x) => x.tag === 'a' && x.absHref && /^https?:/i.test(x.absHref) && !(x.href ?? '').trim().startsWith('#'))
          .filter((x) => x.isCta || opts.includeExternal || new URL(x.absHref!).origin === pageOrigin)
          .sort((a, b) => Number(b.isCta) - Number(a.isCta) || Number(b.aboveFold) - Number(a.aboveFold));
        const maxLinks = opts.maxLinks ?? 60;
        for (const x of queue) {
          const key = x.absHref!.split('#')[0];
          if (seen.has(key)) { if (x.isCta) seen.get(key)!.isCta = true; continue; }
          if (seen.size >= maxLinks) break;
          const lc: LinkCheck = {
            text: x.text, href: x.href, url: key, isCta: x.isCta, aboveFold: x.aboveFold, selector: x.selector,
            status: null, redirectChain: [], finalUrl: null,
          };
          seen.set(key, lc);
        }
        const checks = [...seen.values()];
        await mapLimit(checks, 6, (lc) => followRedirects(ctx.request, lc, pageOrigin));
        results.push(...checks);

        return { pageUrl: finalUrl, totalLinksOnPage: raw.total, checked: results, usesJsFramework: raw.usesJsFramework };
      } finally {
        await ctx.close();
      }
    });
    return { url, ok: true, durationMs: Date.now() - t0, findings: toFindings(data), data };
  } catch (e) {
    return { url, ok: false, error: errorMessage(e), durationMs: Date.now() - t0, findings: [] };
  }
}

/** Count event listeners attached directly to the element (via CDP). Delegated listeners (React) are not visible. */
async function ownListenerCount(page: import('playwright').Page, selector: string): Promise<number> {
  try {
    const cdp = await page.context().newCDPSession(page);
    const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})` });
    if (!result.objectId) return 0;
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
    await cdp.detach();
    return listeners.filter((l) => ['click', 'mousedown', 'mouseup', 'pointerup', 'pointerdown', 'touchend'].includes(l.type)).length;
  } catch {
    return 0;
  }
}

async function followRedirects(request: APIRequestContext, lc: LinkCheck, pageOrigin: string): Promise<void> {
  let current = lc.url!;
  lc.redirectChain = [current];
  try {
    for (let hop = 0; hop < 10; hop++) {
      let res = await request.fetch(current, { method: 'HEAD', maxRedirects: 0, timeout: 15000, failOnStatusCode: false });
      // Many servers reject HEAD — retry with GET.
      if ([403, 405, 501].includes(res.status()) || res.status() === 404) {
        res = await request.fetch(current, { method: 'GET', maxRedirects: 0, timeout: 15000, failOnStatusCode: false });
      }
      const status = res.status();
      lc.status = status;
      const loc = res.headers()['location'];
      if (status >= 300 && status < 400 && loc) {
        current = new URL(loc, current).toString();
        lc.redirectChain.push(current);
        continue;
      }
      break;
    }
    lc.finalUrl = current;
    const external = new URL(current).origin !== pageOrigin;
    if (lc.status !== null && BOT_STATUSES.has(lc.status) && (external || lc.status !== 400)) lc.problem = 'unverified';
    else if (lc.status !== null && lc.status >= 400) lc.problem = 'broken';
    else if (lc.redirectChain.length >= 4) lc.problem = 'redirect-chain'; // 3+ redirects
  } catch (e) {
    lc.error = errorMessage(e);
    lc.problem = 'unreachable';
  }
}

async function mapLimit<T>(items: T[], limit: number, fn: (x: T) => Promise<void>): Promise<void> {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  }));
}

function toFindings(data: LinksData): Finding[] {
  const out: Finding[] = [];
  // Group dead anchors by label so 20 identical "Order" links become one finding.
  const dead = new Map<string, LinkCheck[]>();
  for (const lc of data.checked) {
    if (lc.problem !== 'no-destination') continue;
    const k = lc.text.toLowerCase();
    dead.set(k, [...(dead.get(k) ?? []), lc]);
  }
  for (const group of dead.values()) {
    const lc = group[0];
    const label = lc.text || lc.selector;
    const n = group.length;
    out.push({
      id: findingId('links', label, 'dead'),
      category: 'conversion',
      severity: group.some((g) => g.aboveFold) ? 'high' : 'medium',
      title: `Button "${truncate(label, 40)}" may have no destination${n > 1 ? ` (${n} elements)` : ''}`,
      claim: label,
      evidence: {
        selector: group.slice(0, 3).map((g) => g.selector).join(', '),
        snippet: `href=${JSON.stringify(lc.href)}`,
        details: { count: n, aboveFold: group.some((g) => g.aboveFold), usesJsFramework: data.usesJsFramework },
      },
      rule: null,
      risk: 'If the button really does nothing, visitors who want to buy cannot continue.',
      fix: 'Give the button a real destination (href to the product / checkout page) or verify its click handler works.',
      // JS frameworks often attach click handlers at the root, which we cannot see.
      confidence: data.usesJsFramework ? 0.35 : 0.75,
    });
  }
  for (const lc of data.checked) {
    if (!lc.problem || lc.problem === 'no-destination' || lc.problem === 'unverified') continue;
    const label = lc.text || lc.href || lc.selector;
    if (lc.problem === 'broken' || lc.problem === 'unreachable') {
      const what = lc.problem === 'broken' ? `returns HTTP ${lc.status}` : `could not be reached (${lc.error})`;
      out.push({
        id: findingId('links', lc.url ?? '', lc.selector),
        category: 'conversion',
        severity: lc.isCta ? 'critical' : 'medium',
        title: lc.isCta ? `Call-to-action "${truncate(label, 40)}" leads to a broken page` : `Broken link: "${truncate(label, 40)}"`,
        claim: label,
        evidence: { url: lc.url ?? undefined, selector: lc.selector, details: { status: lc.status, redirectChain: lc.redirectChain, aboveFold: lc.aboveFold } },
        rule: null,
        risk: lc.isCta
          ? 'Visitors who click the main button reach an error page instead of the offer: paid traffic is wasted and the campaign cannot convert.'
          : 'Visitors hit an error page, which lowers trust and can hurt conversion.',
        fix: `Point "${truncate(label, 40)}" to a working page (the link ${what}). Re-test after deploying.`,
        confidence: lc.problem === 'broken' ? 0.95 : 0.6,
      });
    } else if (lc.problem === 'redirect-chain') {
      out.push({
        id: findingId('links', lc.url ?? '', 'chain'),
        category: 'conversion',
        severity: lc.isCta ? 'medium' : 'low',
        title: `Redirect chain of ${lc.redirectChain.length - 1} hops on "${truncate(label, 40)}"`,
        claim: label,
        evidence: { url: lc.url ?? undefined, selector: lc.selector, details: { redirectChain: lc.redirectChain, finalStatus: lc.status } },
        rule: null,
        risk: 'Each redirect adds delay (especially on mobile) and can drop tracking parameters.',
        fix: `Link directly to the final URL: ${lc.finalUrl}`,
        confidence: 0.9,
      });
    }
  }
  return out;
}
