# ClaimGuard X: aplicația web

Next.js 16 (App Router) + TypeScript + Tailwind v4 + lucide-react.

**Frontend:** template-ul Red Team (`src/components/claim-guard/*`, `src/types/finding.ts`, `src/mock/*`, `src/app/page.tsx`, `src/app/scan/[id]/page.tsx`), legat la scannerul real prin `src/lib/adapters/template.ts`.

**Scanările sunt reale:** „Scanare Nouă” rulează pe server scannerul tehnic din `src/lib/checks/` (Playwright, axe-core) și verificările de afirmații pe bază de reguli (`src/lib/rules.ts`, biblioteca Colegului 4): reclamă ↔ landing page ↔ documente PDF. Nu există încă analiză AI. Scanările sunt salvate ca fișiere în `ui/data/scans/` (sau în Supabase, vezi mai jos). `scan-demo-1`, `scan-clean-demo` și `scan-progress-demo` sunt datele demonstrative din template.

Cerință (o singură dată): `npx playwright install chromium`.

```bash
cd ui
npm install
npm run dev        # http://localhost:3000
```

| Rută | Ce arată |
|---|---|
| `/` | Aplicația cu tab-uri: Scanare Nouă → progres → Raport Activ, plus Istoric (scanări reale + demo) |
| `/scan/<id>` | Link direct către un raport (demo sau real); dacă scanarea rulează, arată progresul live |

### Cum curge o scanare

1. Formularul (`NewScanScreen`) trimite `POST /api/scans` (multipart: adText, landingUrl, productCategory, adImage?, documents[]?) și primește `{ id }`. Pipeline-ul rulează în `after()`.
2. `src/lib/pipeline.ts` are cinci pași, aceiași cu primii cinci din `ScanProgress`:
   - 0: citește PDF-urile (unpdf)
   - 1: `capturePage` + `extractOffer`
   - 2: `checkLinks` + `checkPerformance`
   - 3: `checkAccessibility` + `checkKeyboard`
   - 4: `runClaimRules`, apoi captura paginii cu chenarele fiecărei probleme
3. `ScanProgress` interoghează `GET /api/scans/[id]` la fiecare secundă. La `done` se deschide raportul; la `blocked`/`failed` apare motivul.
4. `toUIReport()` transformă scanarea în `Scan`/`Finding` din template:
   - `risk` → `riskDescription`
   - `rule` → `regulatoryReference`
   - `claim` → `aiSuggestedFix.originalClaim`
   - `fix` → `suggestedClaim`
   - chenarele → `evidence.frames`

   Inspecția dovezilor desenează chenarele pe captura reală a paginii.

**Demo fără internet:** butonul „Populează date demonstrative” scanează `public/demo-site/flawed-shop`, servit chiar de aplicație. Butoanele „Campanii de test” încarcă cele patru campanii ale Colegului 4 (`public/demo-campaigns/<id>`): text, imagine, URL și PDF-uri de dovezi.

**Supabase (schema lui Patrick):** `supabase/migrations` și `src/lib/db/`. Cu `NEXT_PUBLIC_SUPABASE_URL` și `SUPABASE_SERVICE_ROLE_KEY` în `ui/.env.local`, `src/lib/store.ts` trece pe `store-supabase.ts`. Fișierele încărcate și capturile rămân în `data/scans/`. E verificat doar contra tipurilor, nu pe un proiect real.

**Benchmark Colegul 4:** `npx tsx scripts/evaluate-role4.mts` (detalii în `docs/evaluation-role4.md`).

**Test cap-coadă:** din rădăcina repo-ului, `npx tsx scripts/e2e.ts http://localhost:3000 [textul butonului demo]`. Capturile ajung în `ui/.shots/`.
