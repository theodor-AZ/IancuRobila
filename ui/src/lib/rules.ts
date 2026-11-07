import type { OfferData } from "./checks/extractOffer";
import { getRule, ruleText } from "./rules/library";
import type { Category, Finding, ProductCategory, Severity } from "./types";

/**
 * Rule-based claim checks: ad ↔ landing page ↔ product documents.
 * Each finding is tagged with a rule id from Colleague 4's library (src/lib/rules/library.json)
 * and shows that rule's legal reference. Generic by design: the checks follow the library's
 * rule definitions and trigger terms, not any specific campaign.
 * Wording follows the brief: risks and missing evidence, never legal verdicts.
 *
 * `evidence.details.locate` (string) tells the pipeline which page text to frame on the capture.
 */
export interface RuleInput {
  adText: string;
  pageText: string;
  offer: OfferData | null;
  docsText: string;
  hasDocs: boolean;
  productCategory: ProductCategory;
  landingUrl: string;
}

const firstMatch = (re: RegExp, s: string) => s.match(new RegExp(re.source, re.flags.replace("g", "")))?.[0] ?? null;

const AD_DISCOUNT = /(?:-\s?(\d{1,2})\s?%|\b(\d{1,2})\s?%\s?(?:off|discount|reducere)|\breducere\s+(?:de\s+)?(\d{1,2})\s?%|\bup to\s+(\d{1,2})\s?%)/gi;
const FREE_DELIVERY = /\b(free (?:express )?(?:shipping|delivery)|livrare (?:gratuit[aă]|gratis)|transport (?:gratuit|gratis))\b/i;
const ECO = /\b(eco[- ]?friendly|environmentally friendly|planet[- ]safe|green|ecologic[ae]?|prietenos cu mediul|sustainable|sustenabil[aă]?|biodegradable|biodegradabil[aă]?|100% natural|natural[aă]? 100%)\b/i;
const CLIMATE = /\b(climate[- ](?:neutral|positive)|carbon[- ](?:neutral|positive)|co2[- ]neutral|zero carbon(?: footprint)?|neutru (?:climatic|din punct de vedere al carbonului))\b/i;
const CLIMATE_FUTURE = /\b((?:net[- ]zero|climate[- ]neutral|carbon[- ]neutral) by \d{4})\b/i;
const ECO_EVIDENCE = /\b(eu ecolabel|iso 14024|iso 14001|iso 14021|fsc|pefc|nordic swan|blauer engel|life[- ]cycle assessment|lca)\b/i;
const LABEL = /\b(eco[- ]?seal|certified green|sustainability (?:badge|seal|label)|green (?:seal|badge|label)|eco[- ]?label|certified sustainable)\b/i;
const SCOPE = /\b(entirely sustainable|whole product|zero impact|completely (?:green|sustainable)|100% (?:sustainable|recyclable product)|fully sustainable)\b/i;
const COSMETIC = /\b(clinically (?:proven|tested)|dermatologically tested|testat (?:clinic|dermatologic)|\d{1,3}\s?h(?:ours?)? (?:continuous )?(?:hydration|protection|hidratare|protec[tț]ie)(?: protection)?|hypoallergenic|hipoalergenic)\b/i;
const STUDY_EVIDENCE = /\b(study|clinical|panel|subjects|participants|volunteers|in vivo|studiu|voluntari|participan[tț]i)\b/i;
const APPROVAL = /\b((?:eu|authority|government|ministry|health authority|dermatologist association)[- ]approved|approved by (?:the )?(?:eu|european commission|authorit(?:y|ies)|ministry|anvisa|fda))\b/i;
const FREE_FROM = /\b(free from|[0o]% (?:parabens|sulfates|silicones)|f[aă]r[aă] (?:parabeni|sulfa[tț]i|silicon)|toxic (?:competitors|ingredients)|dangerous ingredients)\b/i;
const GUARANTEE = /\b(guaranteed results|results guaranteed|100% guarantee|garantat[ăa]?|in one application|after one application)\b/i;
const VERIFIED = /\b(verified (?:buyer|purchase|customer|review)s?|cump[aă]r[aă]tor verificat)\b/i;
const VERIFICATION_PROCESS = /\b(order (?:id|number) (?:check|match|verified)|verification (?:process|procedure|check)|we verify|checked against orders?)\b/i;
const TESTIMONIAL = /\b(testimonial|customer review|review|five stars|5 stars|★★★★★)\b/i;
const STAFF_AUTHORED = /\b((?:written|authored|provided|drafted|created) by (?:our |the )?(?:staff|employee|team|marketing|in-house)|staff[- ]written|employee (?:review|testimonial)|not (?:from|by) (?:a |real )?customers?)\b/i;
const URGENCY_AD = /\b(only today|today only|last chance|ends (?:today|tonight|soon)|limited time|hurry|doar azi|ultima (?:[sș]ans[aă]|zi)|ofert[aă] limitat[aă])\b/i;
const QTY = /\b(\d{1,4}(?:[.,]\d+)?)\s?(ml|l|g|kg|oz|washes|loads|capsules|tablets|pieces|pcs|h|hours)\b/gi;

function adDiscounts(ad: string): number[] {
  const out: number[] = [];
  for (const m of ad.matchAll(AD_DISCOUNT)) {
    const n = Number(m[1] ?? m[2] ?? m[3] ?? m[4]);
    if (n > 0 && n < 100) out.push(n);
  }
  return [...new Set(out)];
}

const UNIT: Record<string, string> = { l: "ml", ml: "ml", g: "g", kg: "g", oz: "oz", washes: "washes", loads: "washes", capsules: "capsules", tablets: "tablets", pieces: "pieces", pcs: "pieces", h: "h", hours: "h" };
function quantities(s: string): Map<string, Set<number>> {
  const out = new Map<string, Set<number>>();
  for (const m of s.matchAll(QTY)) {
    const unit = UNIT[m[2].toLowerCase()];
    let n = Number(m[1].replace(",", "."));
    if (m[2].toLowerCase() === "l") n *= 1000;
    if (m[2].toLowerCase() === "kg") n *= 1000;
    if (!out.has(unit)) out.set(unit, new Set());
    out.get(unit)!.add(n);
  }
  return out;
}

export function runClaimRules(i: RuleInput): Finding[] {
  const out: Finding[] = [];
  const ad = i.adText;
  const page = i.pageText;
  const docs = i.docsText;
  const both = `${ad}\n${page}`;
  const o = i.offer;
  let n = 0;

  const add = (f: {
    ruleId: string;
    category: Category;
    severity: Severity;
    title: string;
    claim: string;
    source: "ad" | "page" | "document";
    snippet: string;
    locate?: string | null;
    risk?: string;
    fix?: string;
    confidence: number;
    fallbackRule?: string;
  }) => {
    const lib = getRule(f.ruleId);
    out.push({
      id: `R-${String(++n).padStart(2, "0")}`,
      category: f.category,
      severity: f.severity,
      title: f.title,
      claim: f.claim,
      evidence: { source: f.source, url: f.source === "page" ? i.landingUrl : undefined, snippet: f.snippet, details: f.locate ? { locate: f.locate } : undefined },
      rule: ruleText(f.ruleId, f.fallbackRule ?? f.ruleId),
      ruleId: f.ruleId,
      risk: f.risk ?? lib?.riskWording ?? "Possible risk. Review the evidence before launch.",
      fix: f.fix ?? lib?.saferAlternative ?? "Rephrase the claim to what your evidence supports.",
      confidence: f.confidence,
    });
  };
  const where = (re: RegExp) => (firstMatch(re, ad) ? "ad" : "page") as "ad" | "page";

  // ---- Truth & Consistency ----
  const adPct = adDiscounts(ad);
  const pagePrimary = o?.discounts.filter((d) => d.primary).map((d) => d.percent) ?? [];
  const pagePct = [...new Set([...pagePrimary, ...(o?.computedDiscountPercent ? [o.computedDiscountPercent] : [])])];
  if (adPct.length && o) {
    const missing = adPct.filter((p) => !pagePct.includes(p));
    if (missing.length) {
      add({
        ruleId: "PRODUCT-CONSISTENCY",
        category: "truth",
        severity: "critical",
        title: pagePct.length ? "Discount in the ad differs from the landing page" : "Discount in the ad is not shown on the landing page",
        claim: firstMatch(AD_DISCOUNT, ad) ?? `-${missing[0]}%`,
        source: "page",
        snippet: `Ad: ${missing.map((p) => `-${p}%`).join(", ")} · Landing page: ${pagePct.length ? pagePct.map((p) => `-${p}%`).join(", ") : "no discount shown"}`,
        locate: o.discounts.find((d) => d.primary)?.raw,
        risk: "Shoppers who click for the advertised discount find a different one. That reads as bait advertising and wastes the click you paid for.",
        fix: pagePct.length ? `Use the discount the page actually applies: -${pagePct[0]}%` : "Show the advertised discount on the landing page, or remove it from the ad.",
        confidence: pagePct.length ? 0.9 : 0.7,
      });
    }
  }

  // Page-internal price arithmetic: displayed % vs (old − new) / old.
  const shownPct = o?.discounts.find((d) => d.primary)?.percent;
  if (o && shownPct && o.computedDiscountPercent && Math.abs(shownPct - o.computedDiscountPercent) >= 3) {
    add({
      ruleId: "PRICE-MATH",
      category: "legal",
      severity: "high",
      title: "Displayed percentage does not match the price arithmetic",
      claim: `-${shownPct}%`,
      source: "page",
      snippet: `Page shows -${shownPct}%, but ${o.originalPrices.find((p) => p.primary)?.raw ?? "the reference price"} → ${o.prices[0]?.raw ?? "the current price"} is a ${o.computedDiscountPercent}% reduction.`,
      locate: o.discounts.find((d) => d.primary)?.raw,
      fix: `Show the real reduction: -${o.computedDiscountPercent}%`,
      confidence: 0.85,
    });
  }

  // Prior price: documents state a 30-day low below the crossed-out reference price.
  const ref = o?.originalPrices.find((p) => p.primary);
  const prior = docs.match(/(?:lowest|prior|previous|30[- ]day)[^.\n]{0,60}?(\d{1,6}(?:[.,]\d{1,2})?)/i);
  if (ref && prior) {
    const low = Number(prior[1].replace(",", "."));
    if (low > 0 && low < ref.amount) {
      add({
        ruleId: "PRICE-PRIOR",
        category: "legal",
        severity: "high",
        title: "Discount reference price is above the 30-day lowest price",
        claim: ref.raw,
        source: "document",
        snippet: `Page reference price ${ref.raw}; the documents give a lower prior price (${prior[0].trim()}).`,
        locate: ref.raw,
        confidence: 0.75,
      });
    }
  }

  // Quantities: ad vs documents / page (volume, washes, hours…).
  const adQ = quantities(ad);
  const recQ = quantities(`${docs}\n${page}`);
  for (const [unit, adVals] of adQ) {
    const rec = recQ.get(unit);
    if (!rec || !rec.size) continue;
    const conflict = [...adVals].find((v) => !rec.has(v));
    if (conflict !== undefined) {
      const recVals = [...rec].filter((v) => v !== conflict);
      if (!recVals.length) continue;
      add({
        ruleId: "PRODUCT-CONSISTENCY",
        category: "truth",
        severity: "high",
        title: `Ad and product record disagree (${unit})`,
        claim: `${conflict} ${unit}`,
        source: i.hasDocs ? "document" : "page",
        snippet: `Ad: ${conflict} ${unit} · Product record: ${recVals.slice(0, 3).join(", ")} ${unit}`,
        locate: null,
        risk: "Customers receive a different quantity than the ad promised.",
        fix: `Use the quantity in the product record: ${recVals[0]} ${unit}`,
        confidence: 0.7,
      });
    }
  }

  const adFree = firstMatch(FREE_DELIVERY, ad);
  if (adFree && o) {
    if (o.shipping.free === false && o.shipping.costs.length) {
      const c = o.shipping.costs[0];
      add({
        ruleId: "MATERIAL-OMISSIONS",
        category: "truth",
        severity: "high",
        title: `"${adFree}" in the ad, but the page charges ${c.raw} for shipping`,
        claim: adFree,
        source: "page",
        snippet: `Landing page: "${o.shipping.mentions[0]?.context ?? c.raw}"`,
        locate: c.raw,
        risk: "A delivery cost that appears only on the page is a top reason for abandoned carts, and the mismatch may be read as misleading.",
        fix: `Remove "${adFree}" from the ad, or make delivery free on the page.`,
        confidence: 0.85,
      });
    } else if (o.shipping.free === "conditional" && o.shipping.freeThreshold) {
      add({
        ruleId: "MATERIAL-OMISSIONS",
        category: "truth",
        severity: "medium",
        title: `"${adFree}" applies only above ${o.shipping.freeThreshold.raw}`,
        claim: adFree,
        source: "page",
        snippet: `Landing page: "${o.shipping.mentions[0]?.context ?? ""}"`,
        locate: o.shipping.freeThreshold.raw,
        fix: `${adFree} on orders over ${o.shipping.freeThreshold.raw}`,
        confidence: 0.75,
      });
    }
  }

  // ---- Legal & Compliance (environmental) ----
  const future = firstMatch(CLIMATE_FUTURE, both);
  if (future) {
    add({ ruleId: "ENV-FUTURE", category: "legal", severity: "high", title: "Future environmental performance claim", claim: future, source: where(CLIMATE_FUTURE), snippet: `"${future}"`, locate: future, confidence: 0.7 });
  }
  const climate = firstMatch(CLIMATE, both);
  if (climate && !future) {
    add({
      ruleId: "ENV-OFFSET",
      category: "legal",
      severity: "critical",
      title: "Climate-neutral claim for the product",
      claim: climate,
      source: where(CLIMATE),
      snippet: `"${climate}" found in the ${where(CLIMATE) === "ad" ? "ad" : "landing page"}.${/offset|compensat/i.test(docs) ? " The documents mention offsetting." : ""}`,
      locate: climate,
      confidence: /offset|compensat/i.test(docs) ? 0.85 : 0.7,
    });
  }
  const label = firstMatch(LABEL, both);
  if (label && !ECO_EVIDENCE.test(docs)) {
    add({ ruleId: "ENV-LABEL", category: "legal", severity: "high", title: "Sustainability label without a certification scheme", claim: label, source: where(LABEL), snippet: i.hasDocs ? "No recognised certification scheme found in the documents for this label." : "No documents were uploaded to support this label.", locate: label, confidence: i.hasDocs ? 0.75 : 0.6 });
  }
  const scope = firstMatch(SCOPE, both);
  if (scope) {
    add({ ruleId: "ENV-SCOPE", category: "legal", severity: "high", title: "Environmental claim extended to the whole product", claim: scope, source: where(SCOPE), snippet: `"${scope}"`, locate: scope, confidence: 0.65 });
  }
  const eco = firstMatch(ECO, ad) ?? firstMatch(ECO, page);
  if (eco && !ECO_EVIDENCE.test(docs) && !ECO_EVIDENCE.test(page)) {
    add({
      ruleId: "ENV-GENERIC",
      category: "legal",
      severity: "high",
      title: "Generic environmental claim without supporting evidence",
      claim: eco,
      source: i.hasDocs ? "document" : where(ECO),
      snippet: i.hasDocs ? "No environmental certification or performance data found in the uploaded documents." : "No product documents were uploaded, and the page names no certification.",
      locate: eco,
      confidence: i.hasDocs ? 0.8 : 0.65,
    });
  }

  // ---- Legal & Compliance (cosmetics) ----
  if (i.productCategory === "cosmetics") {
    const cos = firstMatch(COSMETIC, ad) ?? firstMatch(COSMETIC, page);
    if (cos && !STUDY_EVIDENCE.test(docs)) {
      add({
        ruleId: "COS-EVIDENCE",
        category: "legal",
        severity: "high",
        title: `"${cos}" without a supporting study`,
        claim: cos,
        source: i.hasDocs ? "document" : where(COSMETIC),
        snippet: i.hasDocs ? "No clinical study, panel size or test duration found in the uploaded documents." : "No product documents were uploaded to support this claim.",
        locate: cos,
        confidence: i.hasDocs ? 0.8 : 0.6,
      });
    }
    const appr = firstMatch(APPROVAL, both);
    if (appr) {
      add({ ruleId: "COS-APPROVAL", category: "legal", severity: "high", title: "Authority approval claim for a cosmetic", claim: appr, source: where(APPROVAL), snippet: `"${appr}"`, locate: appr, confidence: 0.75 });
    }
    const ff = firstMatch(FREE_FROM, both);
    if (ff) {
      add({ ruleId: "COS-FAIRNESS", category: "legal", severity: "low", title: "Claim may denigrate legal ingredients or competitors", claim: ff, source: where(FREE_FROM), snippet: `"${ff}"`, locate: ff, confidence: 0.5 });
    }
    const guar = firstMatch(GUARANTEE, both);
    if (guar) {
      add({ ruleId: "COS-CONDITIONS", category: "legal", severity: "medium", title: "Guaranteed or instant result claim", claim: guar, source: where(GUARANTEE), snippet: `"${guar}"`, locate: guar, confidence: 0.6 });
    }
  }

  // ---- Reviews ----
  const verified = firstMatch(VERIFIED, page);
  if (verified && !VERIFICATION_PROCESS.test(docs)) {
    add({ ruleId: "REVIEWS-VERIFIED", category: "legal", severity: "high", title: "\"Verified\" review badge without a verification process", claim: verified, source: "page", snippet: i.hasDocs ? "The documents describe no check that reviewers actually bought the product." : "No documents describe how purchases are verified.", locate: verified, confidence: i.hasDocs ? 0.7 : 0.5 });
  }
  if (TESTIMONIAL.test(page) && STAFF_AUTHORED.test(docs)) {
    const t = firstMatch(TESTIMONIAL, page)!;
    add({ ruleId: "REVIEWS-FAKE", category: "trust", severity: "high", title: "Testimonial may not come from a real customer", claim: t, source: "document", snippet: `The documents say: "${firstMatch(STAFF_AUTHORED, docs)}".`, locate: t, confidence: 0.75 });
  }

  // ---- Pressure tactics ----
  const scarcity = o?.stock.find((s) => s.primary && /only|doar|ultimele|last|limited|limitat|selling fast|almost gone/i.test(s.raw));
  if (scarcity) {
    const claimed = Number(scarcity.raw.match(/\d+/)?.[0] ?? NaN);
    const inv = docs.match(/(?:inventory|in stock|stock level|units? available|on hand)[^.\n]{0,30}?(\d{1,6})/i);
    const conflict = inv && Number.isFinite(claimed) && Number(inv[1]) > claimed;
    add({
      ruleId: "SCARCITY-STOCK",
      category: "trust",
      severity: conflict ? "high" : "medium",
      title: conflict ? "Stock message conflicts with the inventory record" : "Scarcity claim without an inventory source",
      claim: scarcity.raw,
      source: conflict ? "document" : "page",
      snippet: conflict ? `Page: "${scarcity.raw}" · Documents: "${inv![0].trim()}"` : `Page text "${scarcity.context}"${o?.schemaAvailability ? `; structured data says availability: ${o.schemaAvailability} (no quantity)` : ""}.`,
      locate: scarcity.raw,
      fix: `Show the real stock count from your inventory system, or remove "${scarcity.raw}".`,
      confidence: conflict ? 0.85 : 0.6,
    });
  }
  const urgAd = firstMatch(URGENCY_AD, ad);
  const urgPage = o?.urgency.find((u) => u.primary);
  if (urgAd || urgPage) {
    add({
      ruleId: "SCARCITY-TIME",
      category: "legal",
      severity: urgPage ? "high" : "medium",
      title: urgPage ? "Countdown or deadline without a stated end date" : "Urgency claim without a stated end date",
      claim: [urgAd, urgPage?.raw].filter(Boolean).join(" · "),
      source: urgPage ? "page" : "ad",
      snippet: [urgAd && `Ad: "${urgAd}"`, urgPage && `Page: "${urgPage.context}"`].filter(Boolean).join(" · "),
      locate: urgPage?.raw,
      fix: "Offer valid until <exact date>",
      confidence: 0.6,
    });
  }

  return dedupe(out);
}

/** One finding per rule + claim. */
function dedupe(fs: Finding[]): Finding[] {
  const seen = new Set<string>();
  return fs.filter((f) => {
    const k = `${f.ruleId}|${f.claim.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

