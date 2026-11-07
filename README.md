# IancuRobila: ClaimGuard X technical scanner (Colegul 2 sandbox)

Sandbox for **ClaimGuard X – AI Marketing Red Team**: the checks that don't depend on AI. It opens the landing page, screenshots it, tests links, mobile speed and accessibility, and extracts price and conditions. Every module takes a URL and returns `Finding[]` and/or structured data. There are no AI calls and no Supabase writes here; those get wired up later in the main repo.

## Setup

```bash
npm install
npx playwright install chromium
npm run typecheck
```

## Usage

```bash
# full scan of one URL -> fixtures/<name>/
npm run scan -- https://example.com/landing --name my-campaign [--lighthouse]

# serve the local test pages (http://localhost:4173/flawed-shop/, /clean-shop/)
npm run serve

# scan every campaign folder (Colleague 4's demo-campaigns/) -> fixtures/<campaign>/
npx tsx scripts/scan-campaigns.ts demo-campaigns fixtures

# quick offer-extraction probe (+ Lighthouse timing)
npx tsx scripts/probe-offer.ts <url> [--lighthouse]
```

## Modules (`src/checks/`, move to `lib/checks/` in the base)

| Module | Returns | Category |
|---|---|---|
| `capturePage(url)` | desktop + mobile screenshots (full and above the fold), rendered HTML, visible text, headings, above-the-fold text | data for the model |
| `checkLinks(url)` | HTTP status of CTAs and main links; flags 404s, 3+ hop redirect chains and CTA anchors with no destination | `conversion` |
| `checkPerformance(url)` | LCP, FCP, load time and page weight on a throttled mobile (Slow 4G + 4× CPU) | `conversion` |
| `checkAccessibility(url)` | axe-core (WCAG 2.0/2.1/2.2 A+AA) grouped by rule, with plain-language risk and fix, always with "automated checks only" | `accessibility` |
| `extractOffer(url)` | price, crossed-out price, displayed discounts, shipping (free / cost / free-above-threshold), warranty, stock and urgency text, schema.org Product. `primary: true` = main product, not a recommendation | input for the Truth & Consistency comparison done by the base |
| `runLighthouse(url)` | Lighthouse mobile performance score + metrics (14–18 s, on demand) | – |

All modules accept `{ browser }` to share one Chromium instance. They never throw: errors and bot walls come back as `ok: false, error`.

Every module's tone follows rule 5 of the brief: we report risk and missing evidence, never legal verdicts.

## Files

- `src/types.ts`: **provisional** `Finding` type, to be replaced with the one from the base
- `src/browser.ts`: browser launch, navigation, cookie banners, bot-wall detection
- `test-pages/`: local smoke pages (`flawed-shop` with planted issues, `clean-shop` with none). These are not the demo campaigns.
- `fixtures/smoke/`: results on the smoke pages; `fixtures/<campaign>/` will hold Colleague 4's campaigns
- `scanner-notes.md`: what went wrong on real sites, with timings and decisions
