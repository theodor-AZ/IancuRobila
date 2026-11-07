// Measure element boxes on the flawed-shop smoke page as % of the full-page desktop capture.
import { chromium } from 'playwright';
import { startServer } from '../src/serve.ts';
const server = await startServer('test-pages', 4190);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
await p.goto('http://localhost:4190/flawed-shop/');
const H = await p.evaluate(() => document.documentElement.scrollHeight);
const sels: Record<string, string> = {
  discount: '.badge', price: '.price', stock: '.stock', buy: 'a.btn >> text=Buy Now', order: 'a.btn >> text=Order today',
  fine: '.fine', img: '.hero img', icon: '.icon-btn', claims: 'p >> text=48h hydration', h1: 'h1',
};
const out: Record<string, unknown> = { W: 1366, H };
for (const [k, s] of Object.entries(sels)) {
  const bb = await p.locator(s).first().boundingBox();
  if (bb) out[k] = { x: +(bb.x / 1366 * 100).toFixed(2), y: +(bb.y / H * 100).toFixed(2), w: +(bb.width / 1366 * 100).toFixed(2), h: +(bb.height / H * 100).toFixed(2) };
}
console.log(JSON.stringify(out));
await b.close(); server.close();
