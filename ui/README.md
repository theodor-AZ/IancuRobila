# ClaimGuard X UI: design system and screens (THEODOR)

Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Base UI).

**Scans are real:** "New scan" runs the technical scanner from `src/lib/checks/` (Playwright, axe-core) on the server, plus rule-based claim checks (`src/lib/rules.ts`): ad ↔ landing page ↔ PDF documents. Threat frames are computed from element positions on the capture. Not here yet: the AI analysis and Supabase. Scans are stored as files in `ui/data/scans/`. The three `SCN-004x` scans are mock demo data.

Prerequisite (once): `npx playwright install chromium`.

### How a scan flows

1. `POST /api/scans` (multipart: adText, landingUrl, productCategory, adImage?, documents[]?) saves the inputs and returns `{ id }`. The pipeline runs in `after()`.
2. `src/lib/pipeline.ts` runs five steps:
   - 0: read PDFs (unpdf)
   - 1: `capturePage` + `extractOffer`
   - 2: `checkLinks` + `checkPerformance`
   - 3: `checkAccessibility`
   - 4: `runClaimRules`, then a full-page capture with frames

   Each step updates `scan.json`. A page behind a bot wall ends with status `blocked`.
3. `GET /api/scans/[id]` is polled by the progress screen. When the status is `done`, the app redirects to the report.
4. To test without the internet, use **Fill with demo campaign** on /scan/new. It scans `public/demo-site/flawed-shop`, which this app serves, with planted issues in all 5 categories.

When the base is ready, `src/lib/store.ts` moves to Supabase (same functions). The AI analysis can replace or extend `runClaimRules`, since its output uses the same `Finding` type.

```bash
cd ui
npm install
npm run dev        # http://localhost:3000
```

| Route | Screen |
|---|---|
| `/` | `ScanHistoryScreen` (scanned campaigns) |
| `/scan/new` | `NewScanScreen` (upload + validation, starts a real scan) |
| `/scan/<id>/progress` | `ScanProgress` (live steps of the real scan; simulated for mock scans) |
| `/scan/SCN-0042` | `ScanReport` with `EvidenceView`, `FindingsTable`, `FindingCard` |
| `/styleguide` | tokens, type, spacing, radii, all shared components and states |

## Direction

- **UI:** security scanner. The campaign is screened, and every located problem is drawn as a numbered **threat frame** on the ad and landing page captures. The same number sits on its row in the findings table; hover or focus either one to light up both.
- **Structure (UX):** pentest report. Executive summary (score, severity counts, risk matrix) → scope → findings register ordered by severity → finding detail (claim, evidence, impact, rule, remediation, confidence) → methodology and limitations.
- Dark is the default theme; light is for daylight and print. The toggle is in the header.

## Handoff: what moves into the base repo

| From this sandbox | To the base | Owner |
|---|---|---|
| `src/app/globals.css` (tokens, both themes) | `app/globals.css` | Colleague 3 (THEODOR), first PR |
| `src/components/ui/severity-badge.tsx`, `category-icon.tsx`, `score-gauge.tsx`, `empty-state.tsx`, `error-state.tsx`, `threat-frame.tsx` | `components/ui/` | Colleague 3, first PR |
| `src/components/brand/*` (logo, theme toggle, app shell) | `components/brand/` | Colleague 3 |
| `src/components/claimguard/*` (screens) | reference / starting point for Colleague 1 | Colleague 1 |
| `src/lib/types.ts`, `src/lib/score.ts` | align with the base's official `Finding` type | base |
| `src/mock/findings.json` (12 findings, all 5 categories), `src/mock/scans.json` (3 scans) | `mock/` | Colleague 1 |
| `public/brand/*` (logo SVG, mark SVG, 512 PNG, OG 1200×630), `src/app/icon.svg` | `public/brand/`, `app/icon.svg` | Colleague 3 |

### Rules for using the components

- Colour only through tokens (`bg-sev-critical-bg`, `text-sev-high-fg`, `text-beam-fg`, `border-border-strong`…). No hand-written hex in screens.
- `SeverityBadge` always shows the word and an icon. Never show severity as colour alone.
- `.num` (Geist Mono, tabular) only for measurements: scores, IDs, URLs, timings. Do not use it as decoration.
- Spacing only from 4 / 8 / 12 / 16 / 24 / 32 (Tailwind 1, 2, 3, 4, 6, 8).
- Radii: `rounded-xs` 2 px (frames, chips), `rounded-sm` 4 px (badges, filters), `rounded-md` 6 px (inputs), `rounded-lg` 8 px (panels, buttons).
- `Frame` coordinates are percentages of the capture (0–100), so they scale with the image. The scanner (`src/checks/*` at the repo root) can produce them from element bounding boxes; see `scripts/boxes.ts`.
- Copy follows rule 5 of the brief: "Possibly non-compliant with…", "No evidence found for…", never "Illegal".

## Demo assets

`public/demo/ad-glowpure.svg` is a fictional ad (invented brand). `public/demo/page-glowpure.png` is the scanner's desktop capture of the local smoke page `test-pages/flawed-shop`.
