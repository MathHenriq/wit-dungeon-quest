// Prints das tarefas que ensinam (lote 4): ler o gráfico (Mercado), diário do
// lago e os outros trabalhos novos. Uso: node scripts/mapa/prints-trabalho4.mjs <pasta> [só]
// (com o vite rodando em 127.0.0.1:5199). `só` = grafico | diario | ... para um só.
import { chromium } from 'playwright-core';
const S = process.argv[2], only = process.argv[3];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', JSON.stringify({ coins: 100, fome: 90, itens: { pao: 3, disco: 1, ovo: 6 } })); });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('ERRO', e.message));
const want = k => !only || only === k;
const go = async q => { await page.goto(`http://127.0.0.1:5199/cidade-demo?${q}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1400); };

if (want('grafico')) {
  await go('zona=wit&loja=mercado');
  await page.getByRole('button', { name: 'GRÁFICOS' }).click(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${S}/grafico-0.png` });
  await go('zona=wit&trabalho=analista');
  await page.getByRole('button', { name: 'TRABALHAR' }).click(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${S}/grafico-1.png` });
  // 1: toca num ponto
  await page.locator('svg circle').nth(4).click({ force: true }); await page.waitForTimeout(300);
  await page.screenshot({ path: `${S}/grafico-2.png` });
  for (let k = 0; k < 3; k++) {
    await page.getByRole('button', { name: 'PRÓXIMA' }).click(); await page.waitForTimeout(300);
    const b = page.locator('button:has(svg)').first();
    if (k === 1 && await b.count()) await b.click();
    else await page.locator('button.flex-1').first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${S}/grafico-${3 + k}.png` });
  }
  await page.getByRole('button', { name: 'PRÓXIMA' }).click(); await page.waitForTimeout(300);
  await page.locator('button.flex-1').first().click(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${S}/grafico-6.png` });
}
if (want('diario')) {
  // um diário de mentira com 20 pescas (o jogo grava sozinho quando pesca)
  await go('zona=lago');
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('wit.progresso'));
    const fish = ['lambari', 'tilapia', 'bagre', 'traira', 'dourado', 'bota'];
    const where = ['margem', 'funda', 'barco'];
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    p.diario = Array.from({ length: 20 }, (_, k) => ({ f: fish[(k * 7) % 6], cm: 15 + (k * 13) % 50, h: [6, 9, 14, 15, 16, 20, 22][k % 7], w: where[(k * 5) % 3], d: day - (k % 3) }));
    delete p.diarioDia;
    localStorage.setItem('wit.progresso', JSON.stringify(p));
  });
  await go('zona=lago&pesca=diario');
  await page.screenshot({ path: `${S}/diario-1.png` });
  await page.locator('button', { hasText: /tarde|margem|barco|funda|manhã/ }).first().click(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${S}/diario-2.png`, fullPage: true });
}
await browser.close();
