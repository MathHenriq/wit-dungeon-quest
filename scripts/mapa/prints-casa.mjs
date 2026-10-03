// Prints da Sua Casa usando os móveis (aviso do botão, TV, cama de noite, aquário).
//   node scripts/mapa/prints-casa.mjs <pasta> [url-base]   (vite de desenvolvimento rodando)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function run(name, query, tx, ty, dir, press) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, ignoreHTTPSErrors: true })).newPage();
  await page.goto(`${base}/cidade-demo${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.evaluate(([x, y, d]) => { const p = window.__interior.player; p.tx = x; p.ty = y; p.dir = d; p.from = null; }, [tx, ty, dir]);
  await page.waitForTimeout(400);
  if (press) { await page.keyboard.press(' '); await page.waitForTimeout(700); }
  await page.screenshot({ path: `${S}/casa-${name}.png` });
  await page.close();
}
await run('aviso', '?sala=casa', 8, 4, 'north', false);
await run('tv', '?sala=casa', 5, 5, 'north', true);
await run('dormir', '?sala=casa&hora=22', 1, 5, 'north', true);
await run('sofa', '?sala=casa', 5, 9, 'north', true);
await browser.close();
