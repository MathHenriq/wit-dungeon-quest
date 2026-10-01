// Prints do compositor (Estúdio de Música) e do pão de verdade (Padaria), jogando de verdade.
//   node scripts/mapa/prints-trabalho2.mjs <pasta>   (com o vite rodando em 127.0.0.1:5199)
import { chromium } from 'playwright-core';
const S = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', JSON.stringify({ coins: 100, fome: 90 })); });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('ERRO', e.message));
// compor
await page.goto('http://127.0.0.1:5199/cidade-demo?zona=wit&trabalho=estudio-musica', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${S}/musica-1.png` });
await page.getByRole('button', { name: 'TRABALHAR' }).click(); await page.waitForTimeout(400);
await page.getByRole('button', { name: 'FESTA' }).click(); await page.waitForTimeout(200);
await page.getByRole('button', { name: 'VIOLÃO' }).click();
await page.getByRole('button', { name: 'TOCAR' }).click(); await page.waitForTimeout(900);
await page.screenshot({ path: `${S}/musica-2.png` });
await page.getByPlaceholder('Nome da música').fill('Festa na Praça');
await page.getByRole('button', { name: 'GRAVAR DISCO' }).click(); await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/musica-3.png` });
// pão
await page.goto('http://127.0.0.1:5199/cidade-demo?trabalho=npc-padaria', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'TRABALHAR' }).last().click(); await page.waitForTimeout(400);
for (let i = 0; i < 3; i++) {
  const btn = page.getByRole('button', { name: 'ENCHER' });
  const b = await btn.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.waitForTimeout(i === 0 ? 650 : 450);
  if (i === 0) await page.screenshot({ path: `${S}/pao-1.png` });
  await page.mouse.up(); await page.waitForTimeout(900);
}
// misturar: círculos na tigela
const area = await page.locator('.h-\\[300px\\]').boundingBox();
const cx = area.x + area.width / 2, cy = area.y + area.height - 90;
await page.mouse.move(cx + 50, cy); await page.mouse.down();
for (let k = 0; k <= 3.3 * 24; k++) { const a = k / 24 * Math.PI * 2; await page.mouse.move(cx + 50 * Math.cos(a), cy + 30 * Math.sin(a)); }
await page.mouse.up(); await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/pao-2.png` });
// sovar
await page.mouse.move(cx, cy); await page.mouse.down();
for (let k = 0; k < 14; k++) { await page.mouse.move(cx + (k % 2 ? -60 : 60), cy, { steps: 4 }); }
await page.mouse.up(); await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/pao-3.png` });
await page.getByRole('button', { name: /Trança/ }).click(); await page.waitForTimeout(1500);
await page.screenshot({ path: `${S}/pao-4.png` });
await page.waitForTimeout(2000 + 500 + 0.62 * 4200 - 200);
await page.screenshot({ path: `${S}/pao-5.png` });
await page.getByRole('button', { name: 'TIRAR DO FORNO' }).dispatchEvent('pointerdown'); await page.waitForTimeout(600);
await page.screenshot({ path: `${S}/pao-6.png` });
console.log(await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('wit.progresso')).itens)));
await browser.close();
