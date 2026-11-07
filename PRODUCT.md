# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Playwright, axe-core, Supabase. Fixed by the team brief ("ClaimGuard X – ce fac colegii cât se construiește baza", 7 Nov 2026).

## Users

Three audiences, weighted equally (confirmed by the user):
- In-house marketers / brand managers checking a campaign before launch.
- Marketing agencies checking client campaigns and passing the report on to the client.
- Entrepreneurs / small online shops who write their own ads.

They all do the same job: before money is spent, they upload an ad (text + image), the landing page URL and the product documents, then read a report of what could go wrong.

## Product Purpose

ClaimGuard X is an AI Marketing Red Team: "Find the flaws. Prove the risks. Fix the campaign." A security engineer finds a system's vulnerabilities before attackers do. In the same way, ClaimGuard X finds a campaign's vulnerabilities before it wastes budget, misleads consumers or damages the brand. Success means the user leaves with a report they can act on: each issue comes with evidence, risk, the applicable rule and a proposed fix.

Pitch slogan: "AI made marketing faster. We make it safer, smarter and more effective."

## Positioning

It is not five tools next to each other. It is one system that understands the ad, the landing page and the evidence documents, and investigates the relationships between them (e.g. the ad says "-50%" while the page says -20%; "100% eco-friendly" with no certification in the documents).

## Operating Context

- Input: ad text + image, landing page URL, product documents (PDF: technical sheet, certifications, studies), product category (cosmetics / general).
- Output: a Red Team report with findings in five categories: legal, truth, conversion, accessibility, trust (trust is a stretch goal).
- Each finding has: id, category, severity (critical / high / medium / low), title, claim, evidence (URL, screenshot, document fragment), rule, risk, fix, confidence 0–1.
- Regulatory hook: EU Directive 2024/825 (EmpCo), applicable EU-wide from 27 September 2026 with no transition period; Regulation 655/2013 for cosmetics claims.
- Reports are read by the jury at the hackathon demo and may be shared with clients.

## Capabilities and Constraints

- The app flags risks and missing evidence. It never gives definitive legal verdicts and never declares a message false. Wording: "Possibly non-compliant with…", "No evidence found for…", never "Illegal".
- Accessibility checks are automated only and must say so ("automated checks only").
- UI text in English; demo campaigns may be in Romanian. Code and file names in English.
- Screens receive data through props from mock JSON in sandboxes.

## Brand Commitments

- Name: "ClaimGuard X". Tagline: "Find the flaws. Prove the risks. Fix the campaign."
- The brief asks for a "security tool" visual language (dark ground, alert accents) and four severity colours working in light and dark mode. No logo, colours or fonts existed before this work (user confirmed: this sandbox creates them).

## Evidence on Hand

- Technical scanner results on local smoke pages: `fixtures/smoke/`.
- No real customers, testimonials, benchmarks or detection-rate numbers yet. The evaluation number ("catches X of Y") comes later from Colleague 4's evaluation and must not be invented.

## Product Principles

1. Evidence before assertion: every finding shows where it was found.
2. Risk language, not verdicts.
3. One system, three sources (ad, page, documents), shown side by side.
4. Fix-first: every problem ships with a concrete rewrite.

## Accessibility & Inclusion

The product audits accessibility, so it must pass its own checks: WCAG 2.2 AA contrast in both themes, severity never conveyed by colour alone, keyboard reachable.
