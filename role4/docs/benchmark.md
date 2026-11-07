# Reproduce and validate

1. Use Node >=22.18 (implemented and tested on Node 26.5). Run `npm run check`. Core validation and evaluator tests have no dependencies.
2. For compile-time and browser checks run `npm install`, `npm run typecheck`, `npx playwright install chromium`, then `npm run test:browser`. Browser binaries may need network access; no cloud accounts are used.
3. Run `npm run serve`. Open `/cosmetics/`, `/detergent/`, `/store/`, `/control/` on http://127.0.0.1:4173. Each HTML file also opens directly from disk. The HTTP server is useful for real 404 checks. Assets, scripts and evidence are entirely local.
4. Provide the scanner with each campaign's ad-copy.md, landing URL, artwork and both evidence documents. Text files duplicate PDFs for scanners without PDF extraction. Use manifest.json as the input inventory. Do not expose ground truth or matching criteria to the scanner. Fix scanner/model version, settings, viewport, date and evidence ingestion configuration in your run notes. No AI prompts are included here.
5. Export findings using schemas/scanner-output.schema.json. Include every campaign explicitly, including `control` with an empty list if no findings. Each Finding retains the requested ten fields. `evidence` and `rule` are strings; `rule` is a library ID or the documented technical ID. The campaign envelope supplies provenance without changing the shared Finding shape. Adapt an existing foundation contract at the boundary if its field types differ.
6. Run `npm run evaluate -- /absolute/path/scanner-output.json reports/run-001`. It validates input and writes Markdown plus JSON reports. An absent input exits with usage and produces no score. Unit tests use synthetic detections only; they are not model performance evidence.

## Matching protocol and metrics

A candidate match requires identical campaign, category and rule ID, plus one case-insensitive normalized phrase from evaluation/matching.json in title, claim or evidence. Scanner IDs need not equal expected IDs; copying an expected ID does not grant credit. This transparent baseline avoids unstable semantic judging, but paraphrases, unrelated uses of a keyword and rule mappings can cause mistakes. Lock criteria before running comparisons. Use the report's pairs and unmatched lists for independent manual adjudication; retain both raw and adjudicated outputs and explain any revisions.

Maximum-cardinality bipartite matching assigns at most one detection to one annotation. Duplicate detections incur false positives. Severity and confidence do not change match eligibility; matched severities are retained for review. TP is matched count; FP is unmatched actual count; FN is unmatched expected count. Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = 2TP/(2TP+FP+FN). Zero denominators are null / N/A. Metrics are micro-aggregated and also reported per category. No true-negative count or accuracy is claimed: a finite universe of negative findings is undefined. Control detections are counted as FP under this benchmark's annotations, pending review.

The benchmark contains 34 annotations in three adversarial campaigns. Repeated accessibility/UX issues deliberately test cross-campaign consistency. Independent categories can describe distinct aspects of a common element; avoid comparing these counts with a scanner that merges categories without mapping first. The control has zero expected findings; that means no intentionally planted issue, not a legal certification. Unexpected real findings should be adjudicated, not silently dismissed.

## Adversarial protocol

- Reload the three bad pages: countdown restarts at five minutes, with no actual deadline in records. Wait past expiry to observe it cycle; browser checks exercise reload only.
- Compare stock label with inventory, testimonial attribution with staff-authorship record, and ad quantities with specifications.
- Verify price arithmetic separately from prior-price history. Store reference EUR 100 produces 40% arithmetic reduction to EUR 60; the record's EUR 75 prior low instead produces 20%.
- Request missing-checkout.html and confirm 404. Tab through quick-buy and icon controls; inspect their roles and accessible names. Measure the low-contrast paragraph against white (about 1.92:1).
- Compare each environmental claim's scope and evidence. No real certificate, institute, customer or brand is represented.

This is a small, public, synthetic regression set, unsuitable as evidence of real-market accuracy. Expand with permissioned real campaigns, independent annotators, disagreements and held-out unseen examples before making performance claims. Collect error costs and review time, not just F1. No survey responses or scanner runs are supplied.
