# Scanner notes: ce a mers prost pe site-uri reale

Probe rulate pe 7 nov 2026 cu `npm run scan -- <url> --out probes`, de pe un laptop Windows 11 cu conexiune obișnuită, Chromium headless (Playwright 1.65). Rezultatele brute sunt în `probes/` (nu e în git, conține HTML și capturi de pe site-uri terțe).

## Rezumat

| Site | Rezultat | Durată totală | Ce am învățat |
|---|---|---|---|
| emag.ro (home) | ok, 5 findings | 42 s | Bannerul de cookies a fost închis automat pe desktop. Pagină grea: 3,5 MB, 93 de request-uri. |
| emag.ro (pagină de produs) | `extractOffer` ok în 4 s | – | Produsul principal e extras corect din JSON-LD: preț 19,99 lei, preț vechi 30,39, reducere -34%. Caruselele de recomandări aduc însă zeci de alte prețuri și reduceri, de aici câmpul `primary`. |
| nivea.ro | ok, 3 findings | 33 s | Fără probleme de acces. 19 touch targets prea mici (WCAG 2.2). |
| decathlon.ro | **blocat** | 40 s | Cloudflare „Just a moment…”. Toate modulele raportează `Page blocked`. Nu încercăm să ocolim protecția anti-bot. |

## Probleme găsite și ce am schimbat

1. **Site-uri care blochează browserul headless (Cloudflare etc.).** Decathlon întoarce pagina de challenge. `detectBlock()` o recunoaște după titlu, statusul HTTP și iframe-ul de captcha, iar fiecare modul întoarce `ok: false` cu `error: "Page blocked: …"`.
   - **Decizie: nu ocolim bot wall-urile** (fără stealth, fără user-agent fals pentru asta, fără rezolvare de captcha). Aplicația scanează landing page-urile *clientului*, care ne poate pune pe allowlist, sau poate scana o pagină de staging.
   - **Pentru demo:** folosim doar campaniile noastre (HTML static servit local, vezi `scripts/scan-campaigns.ts`), niciodată un site real ales pe loc. Altfel demo-ul pică la prima pagină reală.
   - În UI, un scan blocat trebuie afișat ca stare separată („We couldn't access this page: it blocks automated visits. Allowlist us or upload a screenshot.”), nu ca „0 vulnerabilități”.

2. **Viteza paginii de blocare raportată ca viteza site-ului.** La prima rulare, `checkPerformance` a „reușit” pe Decathlon, adică a măsurat pagina Cloudflare. Am reparat: verifică blocarea după navigare.

3. **Fals-pozitive la butoane fără destinație.** La prima rulare pe eMAG au ieșit 36 de findings, dintre care 31 erau „Adauga la Favorite” marcate ca butoane moarte. Handler-ele lor sunt delegate (atașate pe un părinte), deci nu se văd pe element. Am schimbat:
   - `<button>`-urile nu mai sunt marcate niciodată, pentru că aproape toate merg prin JS. Marcăm doar ancore CTA cu `href` lipsă, `#` sau `javascript:void(0)` și fără listener propriu.
   - CTA înseamnă text de acțiune (buy / cumpără / comandă / add to cart…) sau clasă de buton plus poziție deasupra pliului. Nu mai contează doar dimensiunea.
   - Elementele identice se grupează într-o singură vulnerabilitate („… (12 elements)”).
   - Pe site-urile cu framework JS (React/Vue/Next), confidence scade la 0.35.

4. **Linkuri externe „rupte” care de fapt merg.** Facebook răspunde cu 400 oricărui client automat. Statusurile 400/401/403/405/429/999 de pe alt domeniu sunt marcate `unverified` și nu produc finding. Linkurile de social media nu mai sunt considerate CTA.

5. **Bannere de cookies.** Pe eMAG bannerul a fost închis automat pe desktop, dar nu pe mobil (acolo nu a apărut, sau nu a fost recunoscut). Pe Nivea nu a fost nevoie. `dismissConsent()` încearcă selectorii cunoscuți (OneTrust, Cookiebot, Didomi, Usercentrics…) și apoi butoane cu text „Accept / Accept all / Accepta toate / Sunt de acord”. Dacă nu reușește, scanarea continuă oricum, dar captura de ecran poate avea bannerul peste conținut.

6. **Rețea „networkidle” care nu vine niciodată.** Paginile de marketing au trackere care țin rețeaua ocupată. Navigarea așteaptă `load`, apoi maxim 5 s după `networkidle`, apoi merge mai departe.

7. **`tsx` + `page.evaluate`: `ReferenceError: __name is not defined`.** esbuild înfășoară funcțiile cu `__name()`. Am adăugat un shim în fiecare context (`browser.ts`). Atenție la mutarea în baza Next.js: dacă acolo se compilează tot cu esbuild/SWC cu `keepNames`, shim-ul trebuie păstrat.

## Timpi

| Ce | emag.ro | nivea.ro | Pagină de test locală |
|---|---|---|---|
| `capturePage` (desktop + mobil) | 10,6 s | 11,2 s | 2,3 s |
| `checkLinks` | 5,2 s | 4,3 s | 0,6 s |
| `checkPerformance` (throttled) | 19,6 s | 10,1 s | 1,2 s |
| `checkAccessibility` | 4,3 s | 4,4 s | 1,0 s |
| `extractOffer` | 2,6 s | 2,3 s | 0,6 s |
| **Total scan (fără Lighthouse)** | **42 s** | **33 s** | **6 s** |
| Lighthouse mobil (doar performance) | 14 s (produs) | 18 s | – |

- **Lighthouse durează 14–18 s, sub pragul de 60 s din brief.** Totuși îl propun doar la cerere sau în paralel cu restul, nu în calea principală: scanul ar urca la ~1 minut, iar demo-ul trebuie să fie rapid.
- **LCP-ul nostru diferă de cel Lighthouse:** eMAG 12,4 s la noi față de 7,0 s în Lighthouse; Nivea 1,7 s față de 4,6 s. Noi măsurăm real, cu throttling de rețea și CPU 4×; Lighthouse *simulează* throttling-ul. Ambele sunt „lab data”. În raport scriem valoarea și condițiile („simulated mid-range phone on 4G”), fără promisiuni de tip Core Web Vitals reale.
- Modulele rulează acum secvențial, fiecare cu propriul context de browser. Dacă baza vrea un scan mai rapid, `capturePage`, `checkAccessibility` și `extractOffer` pot rula în paralel pe același browser (parametrul `browser`), adică ~15 s în loc de ~40 s pe un site real.

## De întrebat pe grup

- Tipul `Finding` final: `src/types.ts` e provizoriu, scris după brief. Când îl trimite baza, îl înlocuiesc.
- `evidence`: aici e obiect (`url`, `screenshot`, `snippet`, `selector`, `details`). Dacă baza vrea string, fac un adaptor.
- Vrem Lighthouse în fiecare scan sau doar la cerere?
