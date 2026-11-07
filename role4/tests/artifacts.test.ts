import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { root } from '../evaluation/evaluate.ts';
test('all PDF xref offsets and declared stream lengths are valid',()=>{
 for(const c of ['cosmetics','detergent','store','control'])for(const n of [1,2]){
  const pdf=readFileSync(new URL(`demo-campaigns/${c}/evidence-${n}.pdf`,root));const text=pdf.toString('utf8');
  const start=Number(text.match(/startxref\n(\d+)/)![1]);assert.equal(pdf.subarray(start,start+4).toString(),'xref');
  const offsets=[...text.matchAll(/(\d{10}) 00000 n/g)].map(m=>Number(m[1]));
  offsets.forEach((offset,i)=>assert(pdf.subarray(offset).toString().startsWith(`${i+1} 0 obj`)));
  const stream=text.match(/\/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/)!;assert.equal(Buffer.byteLength(stream[2]),Number(stream[1]));
 }
});
test('CLI without scanner output fails without printing performance',()=>{
 const p=spawnSync(process.execPath,['evaluation/evaluate.ts'],{encoding:'utf8'});assert.equal(p.status,1);assert(p.stderr.includes('Usage:'));assert(!p.stdout.includes('Precision'));
});
test('local server returns campaign pages and survives missing files and the root URL',async(t)=>{
 const server=spawn(process.execPath,['scripts/serve.ts'],{env:{...process.env,PORT:'4198'},stdio:'pipe'});
 let errors='';server.stderr.on('data',chunk=>errors+=chunk.toString());
 try {
  let ready=false;
  for(let i=0;i<30;i++){if(server.exitCode!==null)break;try{if((await fetch('http://127.0.0.1:4198/control/')).ok){ready=true;break;}}catch{}await delay(100);}
  if(!ready && /listen EPERM/.test(errors)){t.skip('Sandbox denies local TCP listeners (EPERM)');return;}
  assert(ready,`Server did not start: ${errors}`);
  for(const c of ['cosmetics','detergent','store','control']){
   const page=await fetch(`http://127.0.0.1:4198/${c}/`);assert.equal(page.status,200);assert((await page.text()).includes('FICTIONAL BENCHMARK'));
   const pdf=await fetch(`http://127.0.0.1:4198/${c}/evidence-1.pdf`);assert.equal(pdf.headers.get('content-type'),'application/pdf');assert.equal(pdf.status,200);
  }
  for(const path of ['/store/missing-checkout.html','/missing-campaign/','/']){
   const missing=await fetch(`http://127.0.0.1:4198${path}`);
   assert.equal(missing.status,404,path);
   assert.equal(missing.headers.get('content-type'),'text/plain');
   assert.equal(await missing.text(),'Not found');
   const page=await fetch('http://127.0.0.1:4198/control/');
   assert.equal(page.status,200,'Server must keep serving after a 404');
   assert((await page.text()).includes('FICTIONAL BENCHMARK'));
  }
  assert.equal((await fetch('http://127.0.0.1:4198/%2e%2e%2fpackage.json')).status,403);
 }finally{server.kill();}
});
