// Prints do duelo na Torre: chega na mesa, aceita, joga cartas até acabar.
//   node scripts/mapa/prints-duelo.mjs <pasta> [url-base]   (vite rodando em 127.0.0.1:5199)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
async function run(name, viewport, touch = false, onlyLook = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('CERT')) errors.push(`${name}: ${m.text()}`); });
  await page.goto(`${base}/cidade-demo?sala=torre&andar=1&duelo=2`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  void 0; const key = async (k, ms) => { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); await page.waitForTimeout(250); };
  await page.screenshot({ path: `${S}/${name}-1-convite.png` });
  await page.getByText('DUELAR!').click(); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${S}/${name}-2-duelo.png` });
  if (onlyLook) { await ctx.close(); return; }
  // joga: abre a 1ª carta jogável; se não der, encerra o turno
  for (let t = 0; t < 40; t++) {
    if (await page.getByText('VOLTAR', { exact: true }).isVisible().catch(() => false)) break;
    const myTurn = await page.getByText(/SEU TURNO/).isVisible().catch(() => false);
    if (!myTurn) { await page.waitForTimeout(800); continue; }
    const cards = page.locator('.dv-hand .c');
    const n = await cards.count();
    let played = false;
    for (let i = 0; i < n; i++) {
      await cards.nth(i).click(); await page.waitForTimeout(250);
      if (t === 1 && i === 0) await page.screenshot({ path: `${S}/${name}-3-carta.png` });
      const jogar = page.getByText('JOGAR', { exact: true });
      if (await jogar.isVisible().catch(() => false)) { await jogar.click(); played = true; await page.waitForTimeout(600); break; }
      await page.getByText('FECHAR', { exact: true }).click(); await page.waitForTimeout(150);
    }
    if (await page.getByText(/ESCOLHA \d CARTA/).isVisible().catch(() => false)) {
      const c = page.locator('.dv-hand .c');
      for (let i = 0; i < await c.count(); i++) { await c.nth(i).click(); await page.waitForTimeout(150); if (!await page.getByText(/ESCOLHA \d CARTA/).isVisible().catch(() => false)) break; }
    }
    if (t === 2) await page.screenshot({ path: `${S}/${name}-4-meio.png` });
    if (!played) { await page.locator('.dv-end button').click(); await page.waitForTimeout(900); }
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${S}/${name}-5-fim.png` });
  await ctx.close();
}
await run('pc', { width: 1280, height: 720 });
await run('cel', { width: 844, height: 390 }, true);   // celular deitado
await run('cel-empe', { width: 390, height: 844 }, true, true);   // em pé: pede para girar
await browser.close();
console.log(errors.length ? errors.join('\n') : 'sem erros');
