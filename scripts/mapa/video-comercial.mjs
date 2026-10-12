// Comercial do WIT 2 (para o Matheus revisar): uma gravação só, em 3 cenas.
//   1. passeio pela cidade de dia  2. tarde virando noite (postes acendendo)  3. abertura de um duelo
//   node scripts/mapa/video-comercial.mjs <pasta-saida> [url-base]
// Precisa do vite rodando (127.0.0.1:5199). Sai <pasta>/wit2-comercial.webm (960×540).
import { chromium } from 'playwright-core';
import { readdirSync, renameSync } from 'node:fs';
const dir = process.argv[2] ?? '.', base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, recordVideo: { dir, size: { width: 960, height: 540 } } });
const page = await ctx.newPage();
const go = (q) => page.goto(`${base}/cidade-demo?${q}`, { waitUntil: 'networkidle' });
await go('passeio=1&hora=10');
await page.waitForTimeout(12_000);
await go('passeio=1&zona=lago&hora=17&velocidade=40');
await page.waitForTimeout(10_000);
await go('sala=torre&andar=3&duelo=chefe&comeca=eu');
await page.waitForTimeout(1500);
await page.locator('button', { hasText: 'DUELAR' }).first().click().catch(() => undefined);
await page.waitForTimeout(9000);
// arrasta a primeira carta da mão para a mesa
const card = page.locator('.dv-hand .tcg-card, .dv-hand > *').first();
const box = await card.boundingBox().catch(() => null);
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(480, 270, { steps: 20 });
  await page.mouse.up();
}
await page.waitForTimeout(5000);
await ctx.close();
await browser.close();
const f = readdirSync(dir).filter(n => n.endsWith('.webm') && n !== 'wit2-comercial.webm').sort().pop();
if (f) { renameSync(`${dir}/${f}`, `${dir}/wit2-comercial.webm`); console.log(`${dir}/wit2-comercial.webm`); }
