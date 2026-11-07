---
version: 1
slug: "ui-src-app"
primary_target: "ui/src/app"
related_targets: []
---

Scope: ClaimGuard X app UI (style guide, shared components, report, finding card, evidence view, new scan, scan progress). Visitor mode: operate.

Audience: marketers, agencies, small-shop owners (equal weight); the hackathon jury reads the report.
Job: upload campaign, watch scan, read and act on the Red Team report.

Decision (user, 7 Nov 2026): visual direction = security scanner; information architecture = pentest report.

## Direction contract

THESIS: The campaign goes through a scanner and comes out as a professional security audit. Refuses the generic SaaS dashboard of score tiles and same-size cards.

OWN-WORLD: X-ray screening console. Deep blue-black ground. Neutrals tinted toward the scanner's blue. Severity colours are the threat palette and only appear where they carry meaning. A single cyan "beam" accent marks interactive and scan state. Geist Sans for UI; Geist Mono is used only for measurements, IDs, scores and timings (tabular). Hairline 1px frames, small radii.

STORY: Executive summary (score, counts by severity, scope) → findings table ordered by severity → each finding: description, evidence, impact (risk), rule, remediation (fix), confidence → appendix (methodology, automated-only notes).

SIGNATURE MOVE: Threat frames. Every finding with a location is drawn as a numbered frame on the ad and landing page captures. The same number appears on its row in the findings table, and hovering or selecting either one lights up the other.

FIRST VIEWPORT: Report header with campaign name and scan ID, score dial and severity counts, then the findings table. The evidence pane, with ad and page side by side, shows the frames.

RISK: Scanner styling must not reduce legibility. Keep table density readable, keep contrast AA in both themes, and never use colour as the only cue (severity labels are always text).

seed: 3b819fb6a307d2485c4cb6b19f8d5582 (assigned candidate 5: airport X-ray screening console). Challenger verdicts: orienteering map = competitive (kept: numbered control circle paired with a description row → threat frame ↔ table row); monochrome product marketing = declined (raise: every claim paired with its proof); ikeda datamatics = declined (raise: tabular numerics); cassette j-card, doujin catalog, botanical folio = declined (raise from folio: ad and page shown at the same scale for comparison).
