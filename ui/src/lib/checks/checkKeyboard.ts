import { errorMessage, findingId, newContext, openPage, truncate, withBrowser, type ScanOptions } from './browser';
import type { CheckResult, Finding } from './types';

/**
 * Keyboard operability (WCAG 2.1.1): finds clickable elements a keyboard user cannot reach.
 * Generic heuristics, not covered by axe-core:
 *  - elements with a click handler (inline onclick or a listener seen via CDP) or role="button"/"link",
 *  - that are not natively focusable (a[href], button, input, select, textarea, summary)
 *  - and have no tabindex >= 0.
 */
export async function checkKeyboard(url: string, opts: ScanOptions = {}): Promise<CheckResult<{ count: number }>> {
  const t0 = Date.now();
  try {
    const found = await withBrowser(opts, async (browser) => {
      const ctx = await newContext(browser, 'desktop');
      try {
        const { page, blocked } = await openPage(ctx, url, opts.timeoutMs);
        if (blocked) throw new Error(`Page blocked: ${blocked}`);
        // Mark candidates in the page, then confirm click listeners through CDP.
        const candidates = await page.evaluate(() => {
          const focusable = (el: Element) =>
            el.matches('a[href], button, input, select, textarea, summary, [contenteditable="true"]') ||
            ((el as HTMLElement).tabIndex >= 0 && el.hasAttribute('tabindex'));
          const out: { i: number; text: string; html: string; inline: boolean }[] = [];
          const els = [...document.querySelectorAll('body *')].slice(0, 4000);
          els.forEach((el, i) => {
            const h = el as HTMLElement;
            const r = h.getBoundingClientRect();
            if (!r.width || !r.height || focusable(el)) return;
            const role = el.getAttribute('role');
            const inline = el.hasAttribute('onclick');
            const pointer = getComputedStyle(h).cursor === 'pointer' && !el.closest('a[href], button, label');
            if (inline || role === 'button' || role === 'link' || pointer) {
              h.setAttribute('data-cgx-kb', String(i));
              out.push({ i, text: (h.innerText || h.getAttribute('aria-label') || '').trim().slice(0, 80), html: h.outerHTML.slice(0, 200), inline: inline || role === 'button' || role === 'link' });
            }
          });
          return out.slice(0, 60);
        });
        const cdp = await ctx.newCDPSession(page);
        const confirmed: typeof candidates = [];
        for (const c of candidates) {
          if (c.inline) { confirmed.push(c); continue; }
          try {
            const { result } = await cdp.send('Runtime.evaluate', { expression: `document.querySelector('[data-cgx-kb="${c.i}"]')` });
            if (!result.objectId) continue;
            const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
            if (listeners.some((l) => ['click', 'mousedown', 'mouseup', 'pointerup', 'pointerdown'].includes(l.type))) confirmed.push(c);
          } catch {}
        }
        await cdp.detach().catch(() => {});
        return confirmed;
      } finally {
        await ctx.close();
      }
    });

    const findings: Finding[] = found.length
      ? [{
          id: findingId('kbd', url),
          category: 'accessibility',
          severity: 'high',
          title: `Control cannot be activated by keyboard (${found.length} element${found.length === 1 ? '' : 's'})`,
          claim: found.slice(0, 3).map((f) => f.text || truncate(f.html, 80)).join(' · '),
          evidence: {
            url,
            source: 'page',
            selector: `[data-cgx-kb="${found[0].i}"]`,
            snippet: found.slice(0, 3).map((f) => truncate(f.html, 160)).join('\n'),
            details: { count: found.length, note: 'Automated checks only: they do not cover all WCAG requirements.' },
          },
          rule: 'WCAG 2.x SC 2.1.1 Keyboard',
          ruleId: 'WCAG-2.1.1',
          risk: 'Keyboard and switch users cannot use these controls (for example a quick-buy button), so they cannot complete the purchase. Automated checks only: they do not cover all WCAG requirements.',
          fix: 'Use a real <button> (or <a href>) for clickable controls, or add tabindex="0", a role and Enter/Space key handlers.',
          confidence: 0.75,
        }]
      : [];
    return { url, ok: true, durationMs: Date.now() - t0, findings, data: { count: found.length } };
  } catch (e) {
    return { url, ok: false, error: errorMessage(e), durationMs: Date.now() - t0, findings: [] };
  }
}
