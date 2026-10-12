// Prints do lote de 02/10 (TCG): escolha do Caminho, Grimório, títulos, pacotes guardados.
//   node scripts/mapa/prints-tcg2.mjs <pasta>   (com o vite rodando em 127.0.0.1:5199)
import { chromium } from 'playwright-core';
const S = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => {
  if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', JSON.stringify({
    coins: 900, fome: 90, towerMax: 12, caminhoSugerido: 'sabio', pacotes: { comum: 2, raro: 1 },
    legado: { nivel: 20, xp: 5000, titulos: ['veterano'], pontos: 3 },
  }));
});
const page = await ctx.newPage();
page.on('pageerror', e => console.log('ERRO', e.message));
const go = async q => { await page.goto(`http://127.0.0.1:5199/cidade-demo?${q}`, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500); };
await go('caminho');
await page.screenshot({ path: `${S}/caminho-1.png` });
await page.getByRole('button', { name: /O SÁBIO/ }).click(); await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/caminho-2.png` });
await page.getByRole('button', { name: /SEGUIR O CAMINHO/ }).click(); await page.waitForTimeout(400);
await go('grimorio');
await page.screenshot({ path: `${S}/grimorio-1.png` });
await page.getByRole('button', { name: 'APRENDER' }).first().click(); await page.waitForTimeout(200);
await page.getByRole('button', { name: 'APRENDER' }).nth(1).click(); await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/grimorio-2.png` });
await go('mochila');
await page.getByRole('button', { name: /TÍTULOS/ }).click(); await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/titulos.png` });
await go('sala=loja&painel=pacotes');
await page.screenshot({ path: `${S}/meus-pacotes.png` });
await browser.close();
