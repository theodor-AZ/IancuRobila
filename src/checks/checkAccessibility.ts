import { AxeBuilder } from '@axe-core/playwright';
import { errorMessage, findingId, newContext, openPage, truncate, withBrowser, type Device, type ScanOptions } from '../browser.ts';
import type { CheckResult, Finding, Severity } from '../types.ts';

export const AUTOMATED_NOTE = 'Automated checks only: they catch a subset of accessibility issues and do not cover all WCAG requirements.';

export interface A11yViolation {
  ruleId: string;
  impact: string | null;
  help: string;
  helpUrl: string;
  wcag: string[];
  nodes: { target: string; html: string; summary: string; data?: unknown }[];
}

export interface AccessibilityData {
  device: Device;
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
  axeVersion: string;
}

export interface AccessibilityOptions extends ScanOptions {
  device?: Device;
}

const SEVERITY: Record<string, Severity> = { critical: 'critical', serious: 'high', moderate: 'medium', minor: 'low' };

/** Plain-language title, risk and fix for the rules that matter most on marketing pages. */
const RULE_TEXT: Record<string, { title: string; risk: string; fix: string }> = {
  'color-contrast': {
    title: 'Text with insufficient contrast',
    risk: 'Low-vision visitors and anyone reading on a phone in sunlight may not be able to read this text, including prices or conditions.',
    fix: 'Darken the text or lighten the background until the contrast ratio is at least 4.5:1 (3:1 for large text).',
  },
  'image-alt': {
    title: 'Images without alternative text',
    risk: 'Screen reader users miss what the image communicates (product, offer, badge).',
    fix: 'Add a short alt text describing the image content, or alt="" if the image is purely decorative.',
  },
  'button-name': {
    title: 'Buttons without an accessible name',
    risk: 'Screen readers announce just "button", so users cannot tell what it does (e.g. add to cart).',
    fix: 'Add visible text, or an aria-label describing the action, to every icon-only button.',
  },
  'link-name': {
    title: 'Links without an accessible name',
    risk: 'Screen reader users hear an empty link and cannot tell where it goes.',
    fix: 'Give each link descriptive text, or an aria-label for icon links.',
  },
  label: {
    title: 'Form fields without a label',
    risk: 'Users of assistive technology cannot tell what to type, which blocks sign-up or checkout.',
    fix: 'Associate a <label> with each input, or add aria-label.',
  },
  'html-has-lang': {
    title: 'Page language is not declared',
    risk: 'Screen readers may read the page with the wrong pronunciation.',
    fix: 'Add lang="ro" or lang="en" to the <html> element.',
  },
  'document-title': {
    title: 'Page has no title',
    risk: 'The page is hard to identify in tabs, bookmarks and screen readers.',
    fix: 'Add a descriptive <title>.',
  },
  'meta-viewport': {
    title: 'Zooming is disabled on mobile',
    risk: 'Visitors who need to zoom in cannot read the offer.',
    fix: 'Remove user-scalable=no and maximum-scale=1 from the viewport meta tag.',
  },
  'link-in-text-block': {
    title: 'Links distinguishable only by color',
    risk: 'Color-blind visitors may not see that the text is a link.',
    fix: 'Underline links inside text, or give them a 3:1 contrast with surrounding text plus another visual cue on focus/hover.',
  },
};

/** axe-core in Playwright; results turned into Findings grouped by rule. */
export async function checkAccessibility(url: string, opts: AccessibilityOptions = {}): Promise<CheckResult<AccessibilityData>> {
  const t0 = Date.now();
  const device = opts.device ?? 'mobile';
  try {
    const data = await withBrowser(opts, async (browser) => {
      const ctx = await newContext(browser, device);
      try {
        const { page, blocked } = await openPage(ctx, url, opts.timeoutMs);
        if (blocked) throw new Error(`Page blocked: ${blocked}`);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        return {
          device,
          axeVersion: results.testEngine.version,
          passes: results.passes.length,
          incomplete: results.incomplete.length,
          violations: results.violations.map((v) => ({
            ruleId: v.id,
            impact: v.impact ?? null,
            help: v.help,
            helpUrl: v.helpUrl,
            wcag: v.tags.filter((t) => /^wcag\d{3,4}$/.test(t)).map(formatWcag),
            nodes: v.nodes.map((n) => ({
              target: n.target.join(' '),
              html: truncate(n.html, 200),
              summary: n.failureSummary ?? '',
              data: n.any[0]?.data ?? undefined,
            })),
          })),
        } satisfies AccessibilityData;
      } finally {
        await ctx.close();
      }
    });
    return { url, ok: true, durationMs: Date.now() - t0, findings: toFindings(url, data), data };
  } catch (e) {
    return { url, ok: false, error: errorMessage(e), durationMs: Date.now() - t0, findings: [] };
  }
}

/** "wcag143" -> "1.4.3" */
function formatWcag(tag: string): string {
  const d = tag.replace('wcag', '');
  return d.length === 3 ? `${d[0]}.${d[1]}.${d[2]}` : `${d[0]}.${d[1]}.${d.slice(2)}`;
}

function toFindings(url: string, d: AccessibilityData): Finding[] {
  return d.violations.map((v) => {
    const text = RULE_TEXT[v.ruleId];
    const n = v.nodes.length;
    const first = v.nodes.slice(0, 3);
    let claim = first.map((x) => x.html).join('\n');
    const details: Record<string, unknown> = { axeRule: v.ruleId, impact: v.impact, affectedElements: n, helpUrl: v.helpUrl, note: AUTOMATED_NOTE };
    if (v.ruleId === 'color-contrast') {
      const samples = first.map((x) => x.data as { fgColor?: string; bgColor?: string; contrastRatio?: number; expectedContrastRatio?: string } | undefined).filter(Boolean);
      details.contrastSamples = samples.map((s) => ({ fg: s!.fgColor, bg: s!.bgColor, ratio: s!.contrastRatio, required: s!.expectedContrastRatio }));
      const worst = samples.reduce((m, s) => Math.min(m, s!.contrastRatio ?? 99), 99);
      if (worst < 99) claim = `${claim}\n(contrast ${worst}:1)`;
    }
    return {
      id: findingId('a11y', url, v.ruleId),
      category: 'accessibility',
      severity: SEVERITY[v.impact ?? 'moderate'] ?? 'medium',
      title: `${text?.title ?? v.help} (${n} element${n === 1 ? '' : 's'})`,
      claim,
      evidence: { url, selector: first.map((x) => x.target).join(', '), snippet: first[0]?.summary, details },
      rule: v.wcag.length ? `WCAG 2.x SC ${v.wcag.join(', ')}` : `axe-core: ${v.ruleId}`,
      risk: `${text?.risk ?? v.help + '.'} ${AUTOMATED_NOTE}`,
      fix: text?.fix ?? (first[0]?.summary || `See ${v.helpUrl}`),
      confidence: 0.9,
    } satisfies Finding;
  });
}
