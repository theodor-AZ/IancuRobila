# ClaimGuard X — Role 4 sandbox

Legal risk research, adversarial campaigns and reproducible evaluation for a human-reviewed marketing red-team platform. Everything is contained in this sandbox. No shared repository, Supabase connection, external messaging or AI model prompts are involved.

## Deliverables

- **18 legal rules:** structured explanations, trigger terms, fictional risky claims, safer alternatives, neutral risk wording, verified EUR-Lex references and applicability notes.
- **Four fictional campaigns:** Velunara cosmetics, Mossmorrow detergent, Nookstitch store and Plainharbor clean control. Each includes ad copy, a local SVG, standalone HTML, two evidence PDFs and matching text copies. All three bad campaigns cover all five categories.
- **34 expected findings:** the ten-field Finding shape, five categories, allowed severity enum, evidence locations and proposed fixes. The control has no intentionally planted issues.
- **TypeScript evaluator:** validated campaign envelopes, one-to-one matching, TP/FP/FN, precision/recall/F1, category breakdowns, control false-positive count and Markdown/JSON reports. No scanner performance is claimed.
- **Research materials:** survey, agency outreach draft and five-minute pitch evidence outline. No invented responses, testimonials or outreach sent.
- **QA:** JSON schemas, schema and asset checks, evaluator/CLI/PDF tests, local server integration test and optional Playwright suite.

## Run

Requires Node **22.18+**. Core commands need no package installation:

```sh
npm run check
npm run serve
npm run evaluate -- /path/to/scanner-output.json reports/run-001
```

Open http://127.0.0.1:4173/control/ (or cosmetics/, detergent/, store/). You can also open each index.html directly. The server serves only demo-campaigns and binds to loopback. It does not accept orders or connect to external services.

Scanner input example (shape only; these empty arrays are not a scanner run):

```json
{"campaigns":[{"campaignId":"cosmetics","findings":[]},{"campaignId":"detergent","findings":[]},{"campaignId":"store","findings":[]},{"campaignId":"control","findings":[]}]}
```

Each actual finding requires `id`, `category`, `severity`, `title`, `claim`, `evidence`, `rule`, `risk`, `fix`, `confidence`. See [contracts](lib/contracts.ts) and [input schema](schemas/scanner-output.schema.json). Use rule IDs from the library, or UX-LINK / WCAG technical IDs described in the legal-source notes. `confidence` is a number from 0 to 1.

For optional compile-time and real-browser checks:

```sh
npm install
npm run typecheck
npx playwright install chromium
npm run test:browser
```

The core schema validator supports the keywords used in these schemas and rejects unsupported keywords. The schemas are also portable JSON Schema documents. Node native execution strips TypeScript syntax; compile-time checking is a separate optional command.

## Verification in this sandbox

See [QA record](docs/qa.md) for commands, outcomes and environment limits. The npm registry was unavailable, so no package lock or installed development dependencies are supplied. Run npm install in a network-enabled environment and retain its lockfile for dependency reproducibility. HTTP and browser execution need permission to bind local ports; core artifact/evaluator tests do not.

## Folder structure

```text
.
├── README.md
├── package.json
├── tsconfig.json
├── lib/
│   ├── contracts.ts
│   ├── schema.ts
│   └── rules/rules.json
├── demo-campaigns/
│   ├── manifest.json
│   ├── cosmetics/
│   ├── detergent/
│   ├── store/
│   └── control/
│       # Every campaign: index.html, ad-copy.md, artwork.svg,
│       # evidence-1.pdf/.txt, evidence-2.pdf/.txt
├── evaluation/
│   ├── ground-truth.json
│   ├── matching.json
│   └── evaluate.ts
├── schemas/
│   ├── finding.schema.json
│   ├── ground-truth.schema.json
│   ├── scanner-output.schema.json
│   ├── rules.schema.json
│   ├── matching.schema.json
│   └── manifest.schema.json
├── scripts/
│   ├── validate.ts
│   └── serve.ts
├── tests/
│   ├── evaluator.test.ts
│   ├── artifacts.test.ts
│   └── browser.test.mjs
├── docs/
│   ├── legal-sources.md
│   ├── benchmark.md
│   └── qa.md
└── research/
    ├── marketing-survey.md
    ├── agency-outreach.md
    └── pitch-evidence-outline.md
```

Read [reproduction and matching methodology](docs/benchmark.md) before comparing scanners. Read [legal verification and limitations](docs/legal-sources.md) before using the rules. These fixtures support risk review; neither the rules nor the control provide legal clearance or comprehensive accessibility certification.
