import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage();
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(m.type(), m.text().slice(0, 600)); });
p.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 600)));
for (const r of process.argv.slice(3)) { console.log('==', r); await p.goto(process.argv[2] + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); }
await b.close();
