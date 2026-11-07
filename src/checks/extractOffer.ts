import type { Page } from 'playwright';
import { errorMessage, newContext, openPage, withBrowser, type ScanOptions } from '../browser.ts';
import type { CheckResult } from '../types.ts';

export type Source = 'json-ld' | 'microdata' | 'meta' | 'text' | 'strikethrough';

export interface Money {
  amount: number;
  currency: string | null;
  raw: string;
  source: Source;
  /** Shown in the top part of the page (first ~1.5 screens) — most likely the main product, not a recommendation. */
  primary?: boolean;
}

export interface TextMatch {
  raw: string;
  /** Sentence / line around the match, for the model and the evidence view. */
  context: string;
  /** Shown in the top part of the page (first ~1.5 screens). Lists are sorted primary-first. */
  primary?: boolean;
}

export interface OfferData {
  pageUrl: string;
  product: { name: string | null; brand: string | null; sku: string | null };
  /** Current price candidates, best first (structured data before text). */
  prices: Money[];
  /** Crossed-out / "was" prices. */
  originalPrices: Money[];
  /** Displayed discounts ("-20%", "20% off", "reducere 20%"). */
  discounts: (TextMatch & { percent: number })[];
  /** Discount computed from structured/strikethrough prices, if both exist. */
  computedDiscountPercent: number | null;
  shipping: {
    /**
     * true = page says free, false = page shows a shipping cost, 'conditional' = free only above
     * a minimum order (see freeThreshold), null = nothing found.
     */
    free: boolean | 'conditional' | null;
    freeThreshold: Money | null;
    costs: Money[];
    mentions: TextMatch[];
  };
  warranty: TextMatch[];
  /** Scarcity / stock text: "Only 2 left", "stoc limitat"... */
  stock: TextMatch[];
  /** schema.org availability (e.g. InStock). */
  schemaAvailability: string | null;
  /** Urgency text: countdowns, "offer ends today". */
  urgency: TextMatch[];
  /** Raw schema.org Product objects found in JSON-LD (trimmed). */
  structuredProducts: unknown[];
}

/** Price, displayed discount, shipping cost, warranty, stock text — from HTML and schema.org/Product. */
export async function extractOffer(url: string, opts: ScanOptions = {}): Promise<CheckResult<OfferData>> {
  const t0 = Date.now();
  try {
    const data = await withBrowser(opts, async (browser) => {
      const ctx = await newContext(browser, 'desktop');
      try {
        const { page, blocked } = await openPage(ctx, url, opts.timeoutMs);
        if (blocked) throw new Error(`Page blocked: ${blocked}`);
        return await extractOfferFromPage(page);
      } finally {
        await ctx.close();
      }
    });
    return { url, ok: true, durationMs: Date.now() - t0, findings: [], data };
  } catch (e) {
    return { url, ok: false, error: errorMessage(e), durationMs: Date.now() - t0, findings: [] };
  }
}

export async function extractOfferFromPage(page: Page): Promise<OfferData> {
  const raw = await page.evaluate(() => {
    const jsonld: unknown[] = [];
    for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
      try { jsonld.push(JSON.parse(s.textContent || '')); } catch {}
    }
    const micro = (prop: string) => {
      const el = document.querySelector(`[itemprop="${prop}"]`);
      return el ? el.getAttribute('content') ?? (el as HTMLElement).innerText ?? null : null;
    };
    const meta = (p: string) => document.querySelector(`meta[property="${p}"], meta[name="${p}"]`)?.getAttribute('content') ?? null;
    window.scrollTo(0, 0);
    const topLimit = window.innerHeight * 1.5;
    const struck: { t: string; top: number }[] = [];
    for (const el of document.querySelectorAll('body *')) {
      const h = el as HTMLElement;
      if (struck.length > 30) break;
      if (h.children.length > 2) continue;
      const tag = h.tagName;
      const lineThrough = getComputedStyle(h).textDecorationLine.includes('line-through');
      if (tag === 'DEL' || tag === 'S' || tag === 'STRIKE' || lineThrough) {
        const t = h.innerText?.trim();
        if (t && t.length < 40 && /\d/.test(t) && !struck.some((s) => s.t === t)) struck.push({ t, top: h.getBoundingClientRect().top });
      }
    }
    const topParts: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const t = node.textContent?.trim();
      const el = node.parentElement;
      if (!t || !el) continue;
      const r = el.getBoundingClientRect();
      if (r.top < topLimit && r.bottom > 0 && r.width > 0) topParts.push(t);
    }
    return {
      jsonld,
      micro: { price: micro('price'), currency: micro('priceCurrency'), name: micro('name'), brand: micro('brand'), availability: micro('availability') },
      meta: {
        price: meta('product:price:amount') ?? meta('og:price:amount'),
        currency: meta('product:price:currency') ?? meta('og:price:currency'),
        title: meta('og:title'),
      },
      struck: struck.map((s) => ({ ...s, primary: s.top < topLimit })),
      topText: topParts.join(' '),
      text: document.body?.innerText ?? '',
      title: document.title,
      url: location.href,
    };
  });

  const products = findProducts(raw.jsonld);
  const prices: Money[] = [];
  const originalPrices: Money[] = [];
  let availability: string | null = null;
  let name: string | null = null, brand: string | null = null, sku: string | null = null;

  for (const p of products) {
    name ??= str(p.name);
    brand ??= typeof p.brand === 'object' && p.brand ? str((p.brand as any).name) : str(p.brand);
    sku ??= str(p.sku);
    for (const o of asArray(p.offers)) {
      const offer = o as Record<string, unknown>;
      const cur = str(offer.priceCurrency);
      const amount = num(offer.price ?? offer.lowPrice);
      if (amount !== null) prices.push({ amount, currency: cur, raw: String(offer.price ?? offer.lowPrice), source: 'json-ld' });
      for (const ps of asArray(offer.priceSpecification)) {
        const spec = ps as Record<string, unknown>;
        const a = num(spec.price);
        const isList = /ListPrice|StrikethroughPrice|MSRP/i.test(String(spec.priceType ?? ''));
        if (a !== null && isList) originalPrices.push({ amount: a, currency: str(spec.priceCurrency) ?? cur, raw: String(spec.price), source: 'json-ld' });
      }
      availability ??= str(offer.availability)?.replace(/^https?:\/\/schema\.org\//, '') ?? null;
    }
  }
  const mp = num(raw.micro.price);
  if (mp !== null) prices.push({ amount: mp, currency: raw.micro.currency, raw: raw.micro.price!, source: 'microdata' });
  const metaP = num(raw.meta.price);
  if (metaP !== null) prices.push({ amount: metaP, currency: raw.meta.currency, raw: raw.meta.price!, source: 'meta' });
  availability ??= raw.micro.availability?.replace(/^https?:\/\/schema\.org\//, '') ?? null;
  name ??= raw.micro.name ?? raw.meta.title ?? raw.title ?? null;
  brand ??= raw.micro.brand;

  for (const s of raw.struck) {
    const m = parseMoney(s.t);
    if (m) originalPrices.push({ ...m, source: 'strikethrough', primary: s.primary });
  }

  const text = raw.text;
  // Text prices, only if no structured price was found (text prices are noisy).
  if (!prices.length) {
    for (const m of matchAll(text, MONEY_RE).slice(0, 5)) {
      const money = parseMoney(m.raw);
      if (money && !originalPrices.some((o) => o.raw === m.raw)) prices.push({ ...money, source: 'text' });
    }
  }

  const discounts = matchAll(text, DISCOUNT_RE).map((m) => ({ ...m, percent: Number(m.raw.match(/\d{1,2}/)![0]) }));

  const shipMentions = matchAll(text, SHIPPING_RE);
  const freeShip = matchAll(text, FREE_SHIPPING_RE);
  const costs: Money[] = [];
  const thresholds: Money[] = [];
  for (const m of shipMentions) {
    const r = new RegExp(MONEY_RE.source, 'gi');
    let mm: RegExpExecArray | null;
    while ((mm = r.exec(m.context))) {
      const parsed = parseMoney(mm[0]);
      if (!parsed || parsed.amount <= 0) continue;
      // "free delivery on orders over 150 lei" -> 150 is a threshold, not a cost.
      const before = m.context.slice(Math.max(0, mm.index - 30), mm.index);
      (THRESHOLD_BEFORE.test(before) ? thresholds : costs).push({ ...parsed, source: 'text' });
    }
  }

  // Mark what appears in the top part of the page (main product) and sort it first,
  // so carousel / recommendation prices further down don't get mistaken for the offer.
  const top = norm(raw.topText);
  const markText = <T extends TextMatch>(xs: T[]): T[] =>
    dedupeText(xs).map((x) => ({ ...x, primary: top.includes(norm(x.context)) || top.includes(norm(x.raw)) }))
      .sort((a, b) => Number(b.primary) - Number(a.primary));
  const markMoney = (xs: Money[]): Money[] =>
    dedupeMoney(xs).map((x) => ({ ...x, primary: x.primary ?? (x.source !== 'text' || top.includes(norm(x.raw))) }))
      .sort((a, b) => Number(b.primary) - Number(a.primary));

  const finalPrices = markMoney(prices);
  const finalOriginal = markMoney(originalPrices);
  const best = finalPrices[0];
  const orig = finalOriginal.find((o) => o.primary);
  const computed = best && orig && orig.amount > best.amount ? Math.round((1 - best.amount / orig.amount) * 100) : null;

  return {
    pageUrl: raw.url,
    product: { name, brand, sku },
    prices: finalPrices,
    originalPrices: finalOriginal.slice(0, 10),
    discounts: markText(discounts).slice(0, 10),
    computedDiscountPercent: computed,
    shipping: {
      free: freeShip.length && thresholds.length ? 'conditional' : freeShip.length && !costs.length ? true : costs.length ? false : null,
      freeThreshold: thresholds[0] ?? null,
      costs: markMoney(costs),
      mentions: markText([...freeShip, ...shipMentions]).slice(0, 10),
    },
    warranty: markText(matchAll(text, WARRANTY_RE)).slice(0, 10),
    stock: markText(matchAll(text, STOCK_RE)).slice(0, 10),
    schemaAvailability: availability,
    urgency: markText(matchAll(text, URGENCY_RE)).slice(0, 10),
    structuredProducts: products.slice(0, 3),
  };
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

// --- patterns (English + Romanian) ---
const CUR = String.raw`(?:lei|ron|eur|euro|€|\$|usd|£|gbp)`;
const AMOUNT = String.raw`\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?`;
const MONEY_RE = new RegExp(String.raw`(?:${CUR}\s?(?:${AMOUNT}))|(?:(?:${AMOUNT})\s?${CUR})`, 'gi');
const DISCOUNT_RE = /(?:-\s?\d{1,2}\s?%|\b\d{1,2}\s?%\s?(?:off|discount|reducere|mai ieftin)|\b(?:reducere|discount|save|economise[sș]ti)\s+(?:de\s+)?\d{1,2}\s?%|\bup to \d{1,2}\s?% off)/gi;
const SHIPPING_RE = /\b(?:shipping|delivery|livrare|transport(?:ul)?|expediere|curier)\b/gi;
const FREE_SHIPPING_RE = /\b(?:free (?:shipping|delivery)|livrare (?:gratuit[aă]|gratis)|transport (?:gratuit|gratis)|shipping is free)\b/gi;
const THRESHOLD_BEFORE = /(?:over|above|from|at least|minimum|min\.?|exceeding|peste|de la|minim(?:um)?|comenzi(?:le)? de|mai mari de)\s*$/i;
const WARRANTY_RE = /\b(?:warranty|guarantee[d]?|money[- ]back|garan[tț]i[ea]|garantat[ăa]?|retur gratuit|\d+ (?:days?|zile) (?:return|retur)|returns? within \d+ days|retur [iî]n \d+ zile)\b/gi;
const STOCK_RE = /\b(?:only \d+ (?:left|in stock|remaining)|\d+ left in stock|last \d+ (?:items|pieces)|low stock|limited stock|almost gone|selling fast|out of stock|in stock|doar \d+ (?:buc[aă][tț]i|produse|r[aă]mase)|ultimele \d+(?: buc[aă][tț]i| produse)?|stoc limitat|stoc epuizat|[iî]n stoc|se vinde rapid)\b/gi;
const URGENCY_RE = /\b(?:ends? (?:today|tonight|soon|in \d[\d:]*(?:\s?(?:h|hours?|min(?:utes)?|days?))?)|limited time|last chance|hurry|today only|countdown|expir[aă] (?:azi|[iî]n)|doar azi|ultima ([sș]ans[aă]|zi)|ofert[aă] limitat[aă]|\d{1,2}:\d{2}:\d{2})\b/gi;

/** Non-stateful test (the shared regexes are global). */
const has = (re: RegExp, s: string) => new RegExp(re.source, 'i').test(s);

function matchAll(text: string, re: RegExp): TextMatch[] {
  const out: TextMatch[] = [];
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) && out.length < 50) {
    out.push({ raw: m[0].trim(), context: contextAround(text, m.index, m[0].length) });
  }
  return out;
}

function contextAround(text: string, idx: number, len: number): string {
  const start = Math.max(text.lastIndexOf('\n', idx) + 1, idx - 120);
  let end = text.indexOf('\n', idx + len);
  if (end === -1 || end > idx + len + 120) end = Math.min(text.length, idx + len + 120);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

export function parseMoney(s: string): Omit<Money, 'source'> | null {
  const m = s.match(new RegExp(`(${AMOUNT})`));
  if (!m) return null;
  const amount = normalizeAmount(m[1]);
  if (amount === null) return null;
  const c = s.match(new RegExp(CUR, 'i'))?.[0].toLowerCase() ?? null;
  const currency = c === null ? null : ({ lei: 'RON', ron: 'RON', eur: 'EUR', euro: 'EUR', '€': 'EUR', $: 'USD', usd: 'USD', '£': 'GBP', gbp: 'GBP' } as Record<string, string>)[c] ?? c.toUpperCase();
  return { amount, currency, raw: s.trim() };
}

/** "1.299,99" / "1,299.99" / "49,99" / "49.99" -> number */
function normalizeAmount(s: string): number | null {
  let t = s.replace(/\s/g, '');
  const lastComma = t.lastIndexOf(','), lastDot = t.lastIndexOf('.');
  if (lastComma > lastDot) t = t.replace(/\./g, '').replace(',', '.');
  else if (lastDot > lastComma && lastComma !== -1) t = t.replace(/,/g, '');
  else if (lastDot !== -1 && t.length - lastDot - 1 === 3 && lastComma === -1) t = t.replace(/\./g, ''); // "1.299" thousands
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function findProducts(nodes: unknown[]): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const visit = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    const types = asArray(o['@type']).map(String);
    if (types.some((t) => /^(Product|ProductGroup|IndividualProduct)$/.test(t))) out.push(o);
    if (o['@graph']) visit(o['@graph']);
    if (o.mainEntity) visit(o.mainEntity);
    if (o.itemListElement) visit(o.itemListElement);
    if (o.item) visit(o.item);
  };
  nodes.forEach(visit);
  return out;
}

const asArray = (v: unknown): unknown[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null);
const num = (v: unknown): number | null => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim()) return normalizeAmount(v.replace(/[^\d.,\s]/g, '').trim());
  return null;
};
const dedupeMoney = (xs: Money[]) => xs.filter((x, i) => xs.findIndex((y) => y.amount === x.amount && y.source === x.source) === i);
const dedupeText = <T extends TextMatch>(xs: T[]) => xs.filter((x, i) => xs.findIndex((y) => y.raw.toLowerCase() === x.raw.toLowerCase() && y.context === x.context) === i);
