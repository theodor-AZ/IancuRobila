import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Finding, ScannerOutput, Criterion } from '../lib/contracts.ts';
import { categories } from '../lib/contracts.ts';
import { validate } from '../lib/schema.ts';
export const root = new URL('../', import.meta.url);
export function readJson(path: string): any { return JSON.parse(readFileSync(new URL(path, root), 'utf8')); }
const normalize = (text: string) => text.toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();
export function evaluate(actual: ScannerOutput, expected: Finding[], criteria: Record<string, Criterion>, campaignIds: string[]) {
  validate(readJson('schemas/scanner-output.schema.json'), actual);
  const seen = new Set<string>();
  for (const campaign of actual.campaigns) {
    if (!campaignIds.includes(campaign.campaignId)) throw new Error(`Unknown campaign: ${campaign.campaignId}`);
    if (seen.has(campaign.campaignId)) throw new Error(`Duplicate campaign: ${campaign.campaignId}`);
    seen.add(campaign.campaignId);
    const ids = new Set<string>();
    for (const f of campaign.findings) { if (ids.has(f.id)) throw new Error(`Duplicate finding id: ${f.id}`); ids.add(f.id); }
  }
  if (seen.size !== campaignIds.length) throw new Error('All campaigns, including control, must be explicitly supplied (empty findings allowed).');
  const expectedById = new Map(expected.map(f => [f.id, f]));
  if (expectedById.size !== expected.length) throw new Error('Duplicate expected id');
  for (const f of expected) if (!criteria[f.id]?.anyOf.length) throw new Error(`Missing criterion: ${f.id}`);
  const entries = actual.campaigns.flatMap(c => c.findings.map(f => ({ campaignId: c.campaignId, finding: f })));
  // Maximum-cardinality bipartite matching prevents duplicate credit and greedy undercounting.
  const edges = entries.map(({campaignId, finding: f}) => expected.flatMap((e,i) => {
    const text = normalize(`${f.title} ${f.claim} ${f.evidence}`);
    return e.id.startsWith(campaignId + '-') && f.category === e.category && f.rule === e.rule && criteria[e.id].anyOf.some(t => text.includes(normalize(t))) ? [i] : [];
  }));
  const owner = new Map<number, number>();
  function assign(a: number, visited: Set<number>): boolean {
    for (const e of edges[a]) { if (visited.has(e)) continue; visited.add(e);
      const previous = owner.get(e);
      if (previous === undefined || assign(previous, visited)) { owner.set(e,a); return true; }
    } return false;
  }
  entries.forEach((_,i) => assign(i,new Set()));
  const matched = new Set(owner.values());
  const pairs = [...owner].map(([e,a]) => ({ expectedId: expected[e].id, actualId: entries[a].finding.id, campaignId: entries[a].campaignId, expectedSeverity: expected[e].severity, actualSeverity: entries[a].finding.severity }));
  const falsePositives = entries.filter((_,i) => !matched.has(i));
  const falseNegatives = expected.filter((_,i) => !owner.has(i));
  function metrics(tp: number, fp: number, fn: number) {
    return { truePositives: tp, falsePositives: fp, falseNegatives: fn,
      precision: tp+fp ? tp/(tp+fp) : null, recall: tp+fn ? tp/(tp+fn) : null,
      f1: 2*tp+fp+fn ? 2*tp/(2*tp+fp+fn) : null };
  }
  return { ...metrics(owner.size, falsePositives.length, falseNegatives.length),
    byCategory: Object.fromEntries(categories.map(c => [c, metrics(pairs.filter(p => expectedById.get(p.expectedId)!.category===c).length, falsePositives.filter(x=>x.finding.category===c).length, falseNegatives.filter(x=>x.category===c).length)])),
    pairs, unmatchedActual: falsePositives, unmatchedExpected: falseNegatives,
    controlFalsePositives: falsePositives.filter(x=>x.campaignId==='control').length };
}
export function markdown(result: ReturnType<typeof evaluate>): string {
  const percent = (n: number|null) => n === null ? 'N/A (zero denominator)' : `${(n*100).toFixed(2)}%`;
  return `# Scanner evaluation\n\nTP: ${result.truePositives} | FP: ${result.falsePositives} | FN: ${result.falseNegatives}\n\nPrecision: ${percent(result.precision)}\nRecall: ${percent(result.recall)}\nF1: ${percent(result.f1)}\nControl false positives: ${result.controlFalsePositives}\n\n## Matched pairs\n\n${result.pairs.map(x=>`- ${x.campaignId}/${x.actualId} → ${x.expectedId}; severity ${x.actualSeverity} (expected ${x.expectedSeverity})`).join('\n') || 'None'}\n\n## Unmatched expected\n\n${result.unmatchedExpected.map(x=>`- ${x.id}: ${x.title}`).join('\n')||'None'}\n\n## Unmatched actual (requires adjudication)\n\n${result.unmatchedActual.map(x=>`- ${x.campaignId}/${x.finding.id}: ${x.finding.title}`).join('\n')||'None'}\n\nAutomated matches are provisional. Inspect report.json for category metrics. This small synthetic benchmark does not establish legal correctness or general model performance.\n`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const input = process.argv[2]; if (!input) throw new Error('Usage: npm run evaluate -- <scanner-output.json> [report-directory]');
    const output = resolve(process.argv[3] ?? 'reports/latest');
    const result = evaluate(JSON.parse(readFileSync(resolve(input),'utf8')), readJson('evaluation/ground-truth.json'), readJson('evaluation/matching.json'), readJson('demo-campaigns/manifest.json').map((c: {id:string})=>c.id));
    mkdirSync(dirname(output),{recursive:true}); mkdirSync(output,{recursive:true});
    writeFileSync(resolve(output,'report.json'),JSON.stringify(result,null,2)+'\n');
    writeFileSync(resolve(output,'report.md'),markdown(result)); console.log(markdown(result));
  } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode=1; }
}
