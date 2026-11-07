import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, readJson, markdown } from '../evaluation/evaluate.ts';
import { validate } from '../lib/schema.ts';
import type { Finding, ScannerOutput } from '../lib/contracts.ts';
const expected: Finding[] = readJson('evaluation/ground-truth.json');
const criteria = readJson('evaluation/matching.json');
const ids = ['cosmetics','detergent','store','control'];
const empty = (): ScannerOutput => ({ campaigns: ids.map(campaignId=>({campaignId,findings:[]})) });
const run = (input: ScannerOutput) => evaluate(input,expected,criteria,ids);
test('no detections gives all false negatives and undefined precision',()=>{
 const r=run(empty()); assert.equal(r.truePositives,0);assert.equal(r.falseNegatives,expected.length);assert.equal(r.precision,null);assert.equal(r.recall,0);assert.equal(r.f1,0);
});
test('synthetic exact detections test evaluator arithmetic only',()=>{
 const input=empty();for(const c of input.campaigns)c.findings=expected.filter(f=>f.id.startsWith(c.campaignId+'-'));
 const r=run(input);assert.equal(r.truePositives,expected.length);assert.equal(r.precision,1);assert.equal(r.recall,1);assert.equal(r.f1,1);
 assert(markdown(r).includes('100.00%'));
});
test('duplicate detection earns one credit; control detection is a false positive',()=>{
 const input=empty();input.campaigns[0].findings=[expected[0],{...expected[0],id:'duplicate'}];input.campaigns[3].findings=[expected[0]];
 const r=run(input);assert.equal(r.truePositives,1);assert.equal(r.falsePositives,2);assert.equal(r.controlFalsePositives,1);assert.equal(r.precision,1/3);assert.equal(r.recall,1/expected.length);
});
test('wrong campaign, category, rule or unrelated text cannot match',()=>{
 for(const patch of [{rule:'UNKNOWN'},{category:'truth' as const},{title:'Unrelated',claim:'Unrelated',evidence:'Unrelated'}]){
  const input=empty();input.campaigns[0].findings=[{...expected[0],...patch}];assert.equal(run(input).truePositives,0);
 }
 const input=empty();input.campaigns[1].findings=[expected[0]];assert.equal(evaluate(input,[expected[0]],{[expected[0].id]:criteria[expected[0].id]},ids).truePositives,0);
});
test('missing/duplicate/unknown campaigns and duplicate finding IDs fail loudly',()=>{
 assert.throws(()=>run({campaigns:[]}));
 for(const variant of [empty().campaigns.slice(1),[...empty().campaigns,empty().campaigns[0]],[...empty().campaigns,{campaignId:'unknown',findings:[]} ]])assert.throws(()=>run({campaigns:variant}));
 const input=empty();input.campaigns[0].findings=[expected[0],expected[0]];assert.throws(()=>run(input),/Duplicate finding/);
});
test('schema rejects invalid confidence, missing fields, extra fields and null',()=>{
 const schema=readJson('schemas/finding.schema.json');
 for(const bad of [null,{...expected[0],confidence:1.1},{...expected[0],confidence:'1'},{...expected[0],category:'other'},{...expected[0],surprise:true},{...expected[0],title:' '}]) assert.throws(()=>validate(schema,bad));
 const {claim,...missing}=expected[0];assert.throws(()=>validate(schema,missing));
});
test('augmenting path finds maximum matching instead of greedy undercount',()=>{
 const a={...expected[0],id:'cosmetics-a',claim:'alpha',title:'alpha',evidence:'alpha'};
 const b={...a,id:'cosmetics-b',claim:'beta',title:'beta',evidence:'beta'};
 const input=empty();input.campaigns[0].findings=[{...a,id:'actual-one',claim:'alpha beta'},{...a,id:'actual-two'}];
 assert.equal(evaluate(input,[a,b],{[a.id]:{anyOf:['alpha']},[b.id]:{anyOf:['beta']}},ids).truePositives,2);
});
test('no expected positives: false positive F1 zero, empty F1 undefined',()=>{
 assert.equal(evaluate(empty(),[],{},ids).f1,null);
 const input=empty();input.campaigns[3].findings=[expected[0]];const r=evaluate(input,[],{},ids);assert.equal(r.precision,0);assert.equal(r.recall,null);assert.equal(r.f1,0);
});
