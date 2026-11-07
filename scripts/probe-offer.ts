// Quick probe: extractOffer on one URL, compact print, optional Lighthouse timing.
//   npx tsx scripts/probe-offer.ts <url> [--lighthouse]
import { extractOffer } from '../src/checks/extractOffer.ts';
import { runLighthouse } from '../src/checks/lighthouse.ts';
const url = process.argv[2];
const r = await extractOffer(url);
const d = r.data;
console.log(r.ok, r.error ?? '', `${(r.durationMs / 1000).toFixed(1)}s`);
if (d) console.log(JSON.stringify({
  product: d.product, prices: d.prices, 
  discounts: d.discounts.slice(0, 5).map((x) => `${x.raw}${x.primary ? " *" : ""}`), originalTop: d.originalPrices.slice(0, 3).map((x) => `${x.raw}${x.primary ? " *" : ""}`), computedDiscountPercent: d.computedDiscountPercent,
  shipping: { free: d.shipping.free, costs: d.shipping.costs.slice(0, 3), freeThreshold: d.shipping.freeThreshold },
  warranty: d.warranty.slice(0, 3).map((x) => x.raw), stock: d.stock.map((x) => x.raw),
  availability: d.schemaAvailability, urgency: d.urgency.map((x) => x.raw),
}, null, 1));
if (process.argv.includes('--lighthouse')) console.log('LIGHTHOUSE', JSON.stringify(await runLighthouse(url)));
