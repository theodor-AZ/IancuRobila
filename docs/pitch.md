# ClaimGuard X: schița pitch-ului (5 minute)

Autor: THEODOR. Pitch-ul se ține în engleză (juriul poate fi internațional); notele sunt în română.

Slide-urile folosesc același limbaj vizual ca aplicația: fundal închis (slate), accent indigo, carduri de vulnerabilitate cu Before / After.

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

1. **Scanare Nouă** (15 s): „Populează date demonstrative” completează textul reclamei, imaginea, URL-ul landing page-ului și categoria (cosmetice).
2. **Progres** (10 s): pașii reali ai scannerului se bifează pe rând.
3. **Raportul** (90 s):
   - **Rezumat:** scorul de conformitate (de exemplu 23%, „Risc Critic”) și numărul de vulnerabilități critice + high.
   - **Filtru de gravitate:** CRITICAL → LOW, ca într-un raport de pentest.
   - **Card de vulnerabilitate:** riscul, referința legală (de exemplu Art. 6 din Directiva 2005/29 [PRODUCT-CONSISTENCY]), apoi Before / After cu textul vechi tăiat și propunerea dedesubt, plus **Copy Fix**.
   - **Inspecție dovezi** (momentul „prove the risks”): reclama față de landing page, plus captura reală a paginii cu problema încadrată (de exemplu „Buy Now” care duce la 404).
4. **Export PDF** (5 s): raportul pleacă la client sau la juridic.

Plan B dacă demo-ul live pică: înregistrare de ecran a aceluiași flux, plus raportul demonstrativ de la `/scan/scan-demo-1`.

## 3:40 – 4:20 · Ce ne diferențiază

**Slide:** trei surse care converg: Ad · Landing page · Evidence.

- "Not five tools glued together. One system that reads the ad, the page and the evidence, and investigates the relationships between them."
- Un checker de accesibilitate nu știe ce promite reclama. Un checker juridic nu deschide landing page-ul. Noi găsim contradicțiile *dintre* ele.
- Ton responsabil: "We flag risks and missing evidence. We never give legal verdicts."

## 4:20 – 4:45 · Dovada că merge

- Rezultatul real pe benchmark-ul Colegului 4 (7 nov., scaner pe bază de reguli): **"On our 34-issue synthetic benchmark, ClaimGuard X caught 24 with zero false alarms on the clean campaign."** Detalii și limite: `docs/evaluation-role4.md`.
- Dacă scanerul se schimbă (de exemplu când intră AI-ul), refaceți evaluarea înainte de pitch și actualizați numărul.
- Opțional: 1–2 citate din formularul trimis marketerilor, doar dacă există răspunsuri reale.

## 4:45 – 5:00 · Închidere

**Slide:** logo + slogan.

> "AI made marketing faster. We make it safer, smarter and more effective."

---

## Checklist înainte de pitch

- [ ] Campania de demo rulează local (nu pe un site real, care poate bloca roboții).
- [ ] Scorul și numerele din slide-uri coincid cu raportul real.
- [ ] Numărul din evaluare e cel măsurat, nu estimat (ultima rulare: 24/34, 0 alarme false pe campania curată).
- [ ] Înregistrarea de rezervă e pe laptop, offline.
