import type { OfferData } from "./checks/extractOffer";
import type { Finding, ProductCategory } from "./types";

/**
 * Rule-based claim checks: ad ↔ landing page ↔ product documents.
 * They give the report real Truth / Legal / Trust findings before the AI analysis exists.
 * The base's AI step can replace or extend them; output uses the same Finding shape.
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

const lower = (s: string) => s.toLowerCase();
const firstMatch = (re: RegExp, s: string) => s.match(new RegExp(re.source, re.flags.replace("g", "")))?.[0] ?? null;

const AD_DISCOUNT = /(?:-\s?(\d{1,2})\s?%|\b(\d{1,2})\s?%\s?(?:off|discount|reducere)|\breducere\s+(?:de\s+)?(\d{1,2})\s?%|\bup to\s+(\d{1,2})\s?%)/gi;
const FREE_DELIVERY = /\b(free (?:shipping|delivery)|livrare (?:gratuit[aă]|gratis)|transport (?:gratuit|gratis))\b/i;
const ECO = /\b(eco[- ]?friendly|environmentally friendly|green|ecologic[ae]?|prietenos cu mediul|sustainable|sustenabil[aă]?|biodegradable|biodegradabil[aă]?|100% natural|natural[aă]? 100%)\b/i;
const CLIMATE = /\b(climate[- ]neutral|carbon[- ]neutral|co2[- ]neutral|net[- ]zero|neutru (?:climatic|din punct de vedere al carbonului))\b/i;
const ECO_EVIDENCE = /\b(certif|ecolabel|eu ecolabel|iso 14024|iso 14001|fsc|pefc|nordic swan|blauer engel|life[- ]cycle|lca|recycled content|con[tț]inut reciclat)/i;
const COSMETIC = /\b(clinically (?:proven|tested)|dermatologically tested|testat (?:clinic|dermatologic)|\d{1,3}\s?h(?:ours)? (?:hydration|protection|hidratare|protec[tț]ie)|hypoallergenic|hipoalergenic)\b/i;
const STUDY_EVIDENCE = /\b(study|clinical|panel|subjects|participants|volunteers|in vivo|studiu|voluntari|participan[tț]i)\b/i;
const FREE_FROM = /\b(free from|[0o]% (?:parabens|sulfates|silicones)|f[aă]r[aă] (?:parabeni|sulfa[tț]i|silicon))\b/i;
const URGENCY_AD = /\b(only today|today only|last chance|ends (?:today|tonight|soon)|limited time|doar azi|ultima (?:[sș]ans[aă]|zi)|ofert[aă] limitat[aă])\b/i;
const GUARANTEE = /\b(guaranteed|100% guarantee|garantat[ăa]?|garan[tț]ie 100%)\b/i;

function adDiscounts(ad: string): number[] {
  const out: number[] = [];
  for (const m of ad.matchAll(AD_DISCOUNT)) {
    const n = Number(m[1] ?? m[2] ?? m[3] ?? m[4]);
    if (n > 0 && n < 100) out.push(n);
  }
  return [...new Set(out)];
}

export function runClaimRules(i: RuleInput): Finding[] {
  const out: Finding[] = [];
  const page = lower(i.pageText);
  const ad = i.adText;
  const docs = i.docsText;
  const o = i.offer;
  let n = 0;
  const id = () => `R-${String(++n).padStart(2, "0")}`;

  // ---- Truth & Consistency ----
  const adPct = adDiscounts(ad);
  const pagePrimary = o?.discounts.filter((d) => d.primary).map((d) => d.percent) ?? [];
  const pagePct = [...new Set([...pagePrimary, ...(o?.computedDiscountPercent ? [o.computedDiscountPercent] : [])])];
  if (adPct.length && o) {
    const missing = adPct.filter((p) => !pagePct.includes(p));
    if (missing.length) {
      const pageDisc = o.discounts.find((d) => d.primary);
      out.push({
        id: id(),
        category: "truth",
        severity: "critical",
        title: pagePct.length ? "Discount in the ad differs from the landing page" : "Discount in the ad is not shown on the landing page",
        claim: firstMatch(AD_DISCOUNT, ad) ?? `-${missing[0]}%`,
        evidence: {
          source: "page",
          url: i.landingUrl,
          snippet: `Ad: ${missing.map((p) => `-${p}%`).join(", ")} · Landing page: ${pagePct.length ? pagePct.map((p) => `-${p}%`).join(", ") : "no discount shown"}`,
          details: { locate: pageDisc?.raw },
        },
        rule: "Directive 2005/29/EC, Art. 6(1)(d): misleading action on price advantage",
        risk: "Shoppers who click for the advertised discount find a different one. That reads as bait advertising and wastes the click you paid for.",
        fix: pagePct.length ? `Use the discount the page actually applies: -${pagePct[0]}%` : "Show the advertised discount on the landing page, or remove it from the ad.",
        confidence: pagePct.length ? 0.9 : 0.7,
      });
    }
  }

  const adFree = firstMatch(FREE_DELIVERY, ad);
  if (adFree && o) {
    if (o.shipping.free === false && o.shipping.costs.length) {
      const c = o.shipping.costs[0];
      out.push({
        id: id(),
        category: "truth",
        severity: "high",
        title: `"${adFree}" in the ad, but the page charges ${c.raw} for shipping`,
        claim: adFree,
        evidence: {
          source: "page",
          snippet: `Landing page: "${o.shipping.mentions[0]?.context ?? c.raw}"`,
          details: { locate: c.raw },
        },
        rule: "Directive 2005/29/EC, Art. 6(1)(d): price or manner in which price is calculated",
        risk: "A delivery cost that appears only on the page is a top reason for abandoned carts, and the mismatch may be read as misleading.",
        fix: `Remove "${adFree}" from the ad, or make delivery free on the page.`,
        confidence: 0.85,
      });
    } else if (o.shipping.free === "conditional" && o.shipping.freeThreshold) {
      out.push({
        id: id(),
        category: "truth",
        severity: "medium",
        title: `"${adFree}" applies only above ${o.shipping.freeThreshold.raw}`,
        claim: adFree,
        evidence: { source: "page", snippet: `Landing page: "${o.shipping.mentions[0]?.context ?? ""}"`, details: { locate: o.shipping.freeThreshold.raw } },
        rule: "Directive 2005/29/EC, Art. 7: misleading omission of material information",
        risk: "The ad leaves out the minimum order, so some shoppers will feel misled at checkout.",
        fix: `${adFree} on orders over ${o.shipping.freeThreshold.raw}`,
        confidence: 0.75,
      });
    }
  }

  // ---- Legal & Compliance ----
  const climate = firstMatch(CLIMATE, ad) ?? firstMatch(CLIMATE, i.pageText);
  if (climate) {
    out.push({
      id: id(),
      category: "legal",
      severity: "critical",
      title: "Climate-neutral claim for the product",
      claim: climate,
      evidence: { source: i.hasDocs ? "document" : "ad", snippet: `"${climate}" found in the ${firstMatch(CLIMATE, ad) ? "ad" : "landing page"}.`, details: { locate: climate } },
      rule: "Directive 2024/825 (EmpCo), Annex I point 4c: neutral or reduced impact claims based on offsetting",
      risk: "Possibly non-compliant: since 27 September 2026, claims that a product is climate neutral because of offsetting are on the EU blacklist.",
      fix: "Describe the measured reduction instead (e.g. \"40% lower emissions than our 2024 formula, verified by <body>\"), without a neutrality claim.",
      confidence: 0.8,
    });
  }
  const eco = firstMatch(ECO, ad) ?? firstMatch(ECO, i.pageText);
  if (eco && !ECO_EVIDENCE.test(docs) && !ECO_EVIDENCE.test(page)) {
    out.push({
      id: id(),
      category: "legal",
      severity: "high",
      title: "Generic environmental claim without supporting evidence",
      claim: eco,
      evidence: {
        source: i.hasDocs ? "document" : firstMatch(ECO, ad) ? "ad" : "page",
        snippet: i.hasDocs
          ? "No environmental certification or performance data found in the uploaded documents."
          : "No product documents were uploaded, and the page names no certification.",
        details: { locate: eco },
      },
      rule: "Directive 2024/825 (EmpCo), Annex I point 4a: generic environmental claim without recognised excellent environmental performance",
      risk: "Possibly non-compliant with the EmpCo blacklist, which has applied EU-wide since 27 September 2026 with no transition period.",
      fix: "State the specific, proven benefit and its certification (e.g. \"Packaging made with 50% recycled plastic, certified by <scheme>\"), or remove the claim.",
      confidence: i.hasDocs ? 0.8 : 0.65,
    });
  }

  if (i.productCategory === "cosmetics") {
    const cos = firstMatch(COSMETIC, ad) ?? firstMatch(COSMETIC, i.pageText);
    if (cos && !STUDY_EVIDENCE.test(docs)) {
      out.push({
        id: id(),
        category: "legal",
        severity: "high",
        title: `"${cos}" with no study in the product documents`,
        claim: cos,
        evidence: {
          source: i.hasDocs ? "document" : "ad",
          snippet: i.hasDocs ? "No clinical study, panel size or test duration found in the uploaded documents." : "No product documents were uploaded to support this claim.",
          details: { locate: cos },
        },
        rule: "Regulation (EU) 655/2013, Annex, common criterion 3: evidential support",
        risk: "No evidence found for a measurable cosmetic claim. Authorities can ask for the study at any time.",
        fix: "Add the study reference (panel size, duration) next to the claim, or soften it until the study is available.",
        confidence: i.hasDocs ? 0.8 : 0.6,
      });
    }
    const ff = firstMatch(FREE_FROM, ad) ?? firstMatch(FREE_FROM, i.pageText);
    if (ff) {
      out.push({
        id: id(),
        category: "legal",
        severity: "low",
        title: `"Free from" claim: check it is not denigrating legal ingredients`,
        claim: ff,
        evidence: { source: firstMatch(FREE_FROM, ad) ? "ad" : "page", snippet: `"${ff}"`, details: { locate: ff } },
        rule: "Regulation (EU) 655/2013, Annex, common criterion 5: fairness",
        risk: "Possibly non-compliant if the claim implies that an ingredient allowed by law is harmful.",
        fix: "Keep the claim factual and add the reason it matters to the target user (e.g. for sensitive skin).",
        confidence: 0.5,
      });
    }
  }

  // ---- Brand Trust & Manipulation ----
  const scarcity = o?.stock.find((s) => s.primary && /only|doar|ultimele|last|limited|limitat|selling fast|almost gone/i.test(s.raw));
  if (scarcity) {
    out.push({
      id: id(),
      category: "trust",
      severity: "medium",
      title: "Scarcity claim without an inventory source",
      claim: scarcity.raw,
      evidence: {
        source: "page",
        snippet: `Page text "${scarcity.context}"${o?.schemaAvailability ? `; structured data says availability: ${o.schemaAvailability} (no quantity)` : ""}.`,
        details: { locate: scarcity.raw },
      },
      rule: "Directive 2005/29/EC, Annex I point 7: false limited availability to force an immediate decision",
      risk: "No evidence found that stock is really limited. Unproven scarcity erodes trust once shoppers notice it never changes.",
      fix: `Show the real stock count from your inventory system, or remove "${scarcity.raw}".`,
      confidence: 0.6,
    });
  }
  const urgAd = firstMatch(URGENCY_AD, ad);
  const urgPage = o?.urgency.find((u) => u.primary);
  if (urgAd || urgPage) {
    out.push({
      id: id(),
      category: "trust",
      severity: "medium",
      title: urgAd && urgPage ? "Urgency in the ad and a countdown on the page" : "Urgency claim without a stated end date",
      claim: [urgAd, urgPage?.raw].filter(Boolean).join(" · "),
      evidence: { source: urgPage ? "page" : "ad", snippet: [urgAd && `Ad: "${urgAd}"`, urgPage && `Page: "${urgPage.context}"`].filter(Boolean).join(" · "), details: { locate: urgPage?.raw } },
      rule: "Directive 2005/29/EC, Annex I point 7",
      risk: "If the offer runs longer than the deadline suggests, the urgency may be read as false.",
      fix: "Offer valid until <exact date>",
      confidence: 0.55,
    });
  }
  const guar = firstMatch(GUARANTEE, ad);
  if (guar && !(o?.warranty.length)) {
    out.push({
      id: id(),
      category: "trust",
      severity: "low",
      title: `"${guar}" in the ad, but the page states no guarantee terms`,
      claim: guar,
      evidence: { source: "page", snippet: "No warranty, guarantee or return terms found on the landing page." },
      rule: null,
      risk: "A guarantee without terms is hard to honour and easy to dispute.",
      fix: "Link the guarantee to its terms on the page (duration, conditions, how to claim).",
      confidence: 0.5,
    });
  }

  return out;
}
