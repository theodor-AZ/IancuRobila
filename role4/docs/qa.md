# QA execution record

Executed 7 November 2026 in this isolated sandbox on Node v26.5.0 / npm 11.17.0.

| Command | Observed result |
| --- | --- |
| `npm run validate` | Pass: 18 rules, 34 findings, four campaigns; schemas, IDs, rule references, category coverage, matching criteria, local files and PDF markers checked. |
| `npm run check` | Pass: validation plus 11 tests discovered, 10 passed, zero failed, one explicitly skipped. |
| HTTP integration test within `npm run check` | Local bind returned `listen EPERM` on 127.0.0.1:4198. Test skips only this permission failure, with reason. HTTP behavior has not been verified in this sandbox. |
| `npm install --ignore-scripts --cache /tmp/claimguard-npm-cache --fetch-retries=0 --fetch-timeout=20000` | Failed: DNS `ENOTFOUND registry.npmjs.org`. No dependency installation or lockfile completed. |
| `npm run test:browser` | Could not execute browser checks: `ERR_MODULE_NOT_FOUND` for playwright. Not a passing browser run. |
| `npm run typecheck` | Could not execute static typecheck: `tsc: command not found`. Native Node execution succeeded; this is not equivalent to static checking. |

Core tests exercise zero detections, synthetic perfect matching, duplicates, false positives on control, category/rule/campaign isolation, unrelated text, invalid and missing inputs, maximum matching, zero denominators, report formatting, absent-input CLI behavior, PDF cross-reference offsets and PDF stream lengths. A test expectation was corrected during implementation: a repeated broken-CTA issue moved to another bad campaign legitimately matches that campaign's equivalent annotation. The campaign-isolation test now uses a single-campaign expected annotation to test the intended boundary.

Static local link checking verifies all referenced assets, permits only the intentionally absent missing-checkout.html on the three bad pages, and checks fragment destinations. The optional browser suite exercises page loading, timer resets, computed low-contrast color, nameless icon buttons, broken purchase destinations, control keyboard navigation and control links. It does not establish complete WCAG conformance.

Next verification in a permitted environment: `npm install`, retain the generated lockfile, `npm run typecheck`, `npx playwright install chromium`, `npm run test:browser`, and `npm run check` with local listener permission. Use `npm ci` for subsequent installs after the lockfile exists.

No foundation scanner output was available. No benchmark performance report, survey responses, testimonials, legal-clearance verdicts or model results were generated. Synthetic inputs inside unit tests test evaluator arithmetic only.
