# ClaimGuard X: schița pitch-ului (5 minute)

Autor: THEODOR. Pitch-ul se ține în engleză (juriul poate fi internațional); notele sunt în română.

Slide-urile folosesc același limbaj vizual ca aplicația: fundal închis, chenare numerotate de „threat frame”. Imaginea de deschidere/partajare e în `ui/public/brand/og.png`.

---

## 0:00 – 0:40 · Problema (Directiva 2024/825)

**Slide:** „27 September 2026. No transition period.”

- Since 27 September 2026, the EU Empowering Consumers Directive (2024/825) applies in every member state, with no grace period. Generic green claims like "eco-friendly" or "100% natural" without proof are now on the blacklist.
- AI made it possible to produce 50 ad variants in an afternoon. Nobody checks 50 variants against the law, the landing page and the product evidence.
- Notă: de citat sursele din brief (Baker McKenzie, Anthesis). Nu inventăm cifre de piață.

## 0:40 – 1:20 · Analogia

**Slide:** chenar numerotat peste o reclamă.

- "A security engineer finds the vulnerabilities in a system before attackers exploit them. We do the same for a marketing campaign: we find its vulnerabilities before it burns budget, misleads customers or damages the brand."
- "ClaimGuard X is an AI Marketing Red Team. Find the flaws. Prove the risks. Fix the campaign."

## 1:20 – 3:40 · Demo live (cea mai importantă parte)

Campania de demo cu vulnerabilități plantate (GlowPure Hydra Cream, brand inventat).

1. **New scan** (15 s): lipim textul reclamei, încărcăm imaginea, URL-ul landing page-ului și fișa tehnică PDF. Categoria: cosmetics.
2. **Scan progress** (10 s): cei cinci pași se bifează pe rând, iar fasciculul de scanare trece peste reclamă.
3. **Raportul** (90 s), în ordinea unui raport de pentest:
   - **Executive summary:** scorul (de exemplu 31 / 100, „Critical risk”) și „Fix the 3 critical before launch”.
   - **Risk matrix:** categorie × severitate. Juriul vede dintr-o privire unde e problema.
   - **Evidence view** (momentul „prove the risks”): reclama și pagina una lângă alta. Hover pe rândul 02: chenarul „-50%” din reclamă și chenarul „-20%” de pe pagină se aprind împreună.
   - **Finding card:** dovadă, impact, regula (Art. 6 din Directiva 2005/29), apoi fix-ul cu textul vechi tăiat și cel propus dedesubt, plus **Copy fix**.
   - Încă un exemplu rapid: „Buy Now” duce la 404 (critical, conversion).
4. **Export PDF** (5 s): raportul pleacă la client sau la juridic.

Plan B dacă demo-ul live pică: înregistrare de ecran a aceluiași flux, plus raportul deja generat la `/scan/SCN-0042`.

## 3:40 – 4:20 · Ce ne diferențiază

**Slide:** trei surse care converg: Ad · Landing page · Evidence.

- "Not five tools glued together. One system that reads the ad, the page and the evidence, and investigates the relationships between them."
- Un checker de accesibilitate nu știe ce promite reclama. Un checker juridic nu deschide landing page-ul. Noi găsim contradicțiile *dintre* ele.
- Ton responsabil: "We flag risks and missing evidence. We never give legal verdicts."

## 4:20 – 4:45 · Dovada că merge

- Numărul real din evaluarea Colegului 4: „catches X of Y planted vulnerabilities, Z false alarms”, plus campania curată (0 alarme).
- **Nu completăm numărul până nu avem rezultatul real.**
- Opțional: 1–2 citate din formularul trimis marketerilor, doar dacă există răspunsuri reale.

## 4:45 – 5:00 · Închidere

**Slide:** logo + slogan.

> "AI made marketing faster. We make it safer, smarter and more effective."

---

## Checklist înainte de pitch

- [ ] Campania de demo rulează local (nu pe un site real, care poate bloca roboții).
- [ ] Scorul și numerele din slide-uri coincid cu raportul real.
- [ ] Numărul din evaluare e cel măsurat, nu estimat.
- [ ] Înregistrarea de rezervă e pe laptop, offline.
