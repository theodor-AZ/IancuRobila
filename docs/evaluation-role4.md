# ClaimGuard X evaluation on the Role 4 benchmark (7 Nov 2026)

The app ran on Colleague 4's four fictional campaigns, exactly as a user would use it: ad copy, artwork, landing page URL and both evidence PDFs. The result went into **his evaluator, unchanged** (`role4/evaluation/evaluate.ts`). Script: `ui/scripts/evaluate-role4.mts`. Raw output: `role4/reports/claimguard-run/` (not committed).

## Result

| | |
|---|---|
| Planted vulnerabilities found (TP) | **24 / 34** |
| Recall | **70.6%** |
| Precision | 88.9% |
| F1 | 78.7% |
| False alarms on the clean control campaign | **0** |
| Unmatched findings, pending adjudication (FP) | 3 |

| Category | TP | FP | FN | Recall |
|---|---|---|---|---|
| legal | 7 | 3 | 6 | 53.8% |
| truth | 2 | 0 | 1 | 66.7% |
| conversion | 3 | 0 | 0 | 100.0% |
| accessibility | 9 | 0 | 0 | 100.0% |
| trust | 3 | 0 | 3 | 50.0% |

Missed (FN): cosmetics-07, cosmetics-08, cosmetics-11, detergent-07, detergent-10, detergent-11, store-07, store-08, store-09, store-11.

Unmatched actual findings, to be adjudicated by Colleague 4 (they may be real issues the annotation does not cover): cosmetics/"Verified" review badge without a verification process; detergent/Sustainability label without a certification scheme; detergent/"Verified" review badge without a verification process.

## How to read this, honestly

- The scanner is **rule-based**: technical checks plus the claim rules in `ui/src/lib/rules.ts`, built on Colleague 4's rule library. There is no AI model yet.
- **Partial contamination:** while integrating, the person building the scanner saw the list of ground-truth titles (not the campaign pages or the matching criteria). The checks are generic and follow the rule library, and they were not tuned after this run. Still, this is not a fully independent test.
- This is a small synthetic benchmark (34 annotations). It shows the pipeline works end to end. It is not evidence of real-market accuracy or legal correctness. See `role4/docs/benchmark.md`.
- Suggested pitch wording: *"On our 34-issue synthetic benchmark, ClaimGuard X caught 24 with zero false alarms on the clean campaign."*

Re-run (app running on :3000): `cd ui && npx tsx scripts/evaluate-role4.mts`
