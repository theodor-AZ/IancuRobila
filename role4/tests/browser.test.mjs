import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
// Optional integration suite: explicit execution requires Playwright and its Chromium binary.
test('browser fixtures, countdown reset, broken CTAs and accessible control', async()=>{
 const {chromium}=await import('playwright');
 const server=spawn(process.execPath,['scripts/serve.ts'],{env:{...process.env,PORT:'4197'},stdio:'pipe'});
 let browser;
 try {
  let ready=false;
  for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4197/control/')).ok){ready=true;break;}}catch{}await delay(100);}
  assert(ready,'Fixture server did not start');browser=await chromium.launch({headless:true});const page=await browser.newPage();
  for(const campaign of ['cosmetics','detergent','store']){
   await page.goto(`http://127.0.0.1:4197/${campaign}/`);
   assert.equal(await page.locator('#countdown').innerText(),'05:00');await page.waitForTimeout(1100);assert.notEqual(await page.locator('#countdown').innerText(),'05:00');await page.reload();assert.equal(await page.locator('#countdown').innerText(),'05:00');
   assert.equal(await page.locator('#icon-button').getAttribute('aria-label'),null);
   const response=await page.request.get(`http://127.0.0.1:4197/${campaign}/missing-checkout.html`);assert.equal(response.status(),404);
   const color=await page.locator('#low-contrast').evaluate(el=>getComputedStyle(el).color);assert.equal(color,'rgb(187, 187, 187)');
  }
  await page.goto('http://127.0.0.1:4197/control/');await page.getByRole('link',{name:'Explore specification'}).focus();await page.keyboard.press('Enter');assert(page.url().endsWith('#specification'));
  for(const anchor of await page.locator('a').all()) {const href=await anchor.getAttribute('href');if(!href.startsWith('#'))assert((await page.request.get(new URL(href,page.url()).href)).ok());}
 } finally {await browser?.close();server.kill();}
});
