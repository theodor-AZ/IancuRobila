import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readJson, root } from '../evaluation/evaluate.ts';
import { validate } from '../lib/schema.ts';
import { categories } from '../lib/contracts.ts';
import type { Finding } from '../lib/contracts.ts';
for (const [schema,data] of [['rules','lib/rules/rules.json'],['ground-truth','evaluation/ground-truth.json'],['matching','evaluation/matching.json'],['manifest','demo-campaigns/manifest.json']]) validate(readJson(`schemas/${schema}.schema.json`),readJson(data));
const rules = readJson('lib/rules/rules.json');
const expected: Finding[] = readJson('evaluation/ground-truth.json');
const manifest = readJson('demo-campaigns/manifest.json');
for (const list of [rules,expected,manifest]) assert.equal(new Set(list.map((r:{id:string})=>r.id)).size,list.length,'IDs must be unique');
const references = new Set([...rules.map((r:{id:string})=>r.id),'UX-LINK','WCAG-1.4.3','WCAG-4.1.2','WCAG-2.1.1']);
for (const f of expected) { assert(references.has(f.rule),`Unknown rule ${f.rule}`); assert(manifest.some((c:{id:string;control:boolean})=>!c.control&&f.id.startsWith(c.id+'-')),`Unexpected campaign ${f.id}`); }
assert.deepEqual(Object.keys(readJson('evaluation/matching.json')).sort(),expected.map(f=>f.id).sort());
for (const c of manifest) {
  for (const file of [c.landingPage,c.adCopy,...c.evidence,`demo-campaigns/${c.id}/artwork.svg`]) assert(existsSync(new URL(file,root)),file);
  for (let i=1;i<=2;i++) {
    const pdf=readFileSync(new URL(`demo-campaigns/${c.id}/evidence-${i}.pdf`,root),'utf8');
    assert(pdf.startsWith('%PDF-1.4')); assert(pdf.includes('FICTIONAL BENCHMARK EVIDENCE')); assert(pdf.endsWith('%%EOF\n'));
  }
  const page=readFileSync(new URL(c.landingPage,root),'utf8');
  for (const match of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if(match[1].startsWith('#')) { assert(page.includes(`id="${match[1].slice(1)}"`)); continue; }
    if(match[1]==='missing-checkout.html'&&!c.control) continue;
    assert(existsSync(new URL(match[1],new URL(c.landingPage,root))),match[1]);
  }
  if (!c.control) for (const category of categories) assert(expected.some(f=>f.id.startsWith(c.id+'-')&&f.category===category));
  else { assert(!page.includes('missing-checkout')); assert.equal(expected.filter(f=>f.id.startsWith(c.id+'-')).length,0); }
}
console.log(`Validated ${rules.length} legal rules, ${expected.length} findings, ${manifest.length} campaigns, schemas, references and local assets.`);
