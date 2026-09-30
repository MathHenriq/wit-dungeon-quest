// Prints do mundo grande: viagem entre áreas, Lago (barco, pesca, Casa de Pesca), mapa.
//   node scripts/mapa/prints-mundo.mjs <pasta> [url-base]   (com o vite rodando)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
async function open(name, query, viewport = { width: 1280, height: 720 }, touch = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(`${base}/cidade-demo${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const shot = n => page.screenshot({ path: `${S}/${name}-${n}.png` });
  const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(300); };
  const tap = async key => { await page.keyboard.down(key); await page.waitForTimeout(key.startsWith('Arrow') ? 90 : 30); await page.keyboard.up(key); await page.waitForTimeout(350); };
  return { page, ctx, shot, hold, tap };
}

// 1) do Centro para o Lago, andando pela borda leste
{
  const { ctx, shot, hold, page } = await open('viagem', '?pos=61,20');
  await shot('centro');
  await hold('ArrowRight', 700);
  await page.waitForTimeout(1200);
  await shot('chegou-lago');
  await hold('ArrowLeft', 600);
  await page.waitForTimeout(1400);
  await shot('voltou-centro');
  await ctx.close();
}
// 2) Lago: vila e cais; embarca e navega
{
  const { ctx, shot, hold, tap, page } = await open('lago', '?zona=lago&pos=32,21');
  await shot('cais');
  await tap('ArrowRight');   // vira para o barco
  await tap(' ');            // embarca
  await shot('embarcou');
  await hold('ArrowRight', 1500);
  await hold('ArrowUp', 800);
  await shot('navegando');
  // pesca do barco: vira para o leste e lança
  await tap('ArrowRight'); await tap(' ');
  await page.waitForTimeout(700);
  await shot('pescando');
  // espera morder (até 10 s) e fisga
  await page.waitForFunction(() => document.querySelector('canvas[data-pesca]')?.dataset.pesca === 'bite', null, { timeout: 12000 });
  await shot('mordeu');
  await page.keyboard.press(' ');
  await page.waitForTimeout(200);
  await shot('minijogo');
  // aperta quando a agulha passa pelo verde (lê a posição na tela)
  for (let i = 0; i < 200; i++) {
    const inZone = await page.evaluate(() => {
      const bar = [...document.querySelectorAll('div')].find(d => d.style.animation?.startsWith('wit-needle'));
      if (!bar) return false;
      const zone = bar.previousElementSibling, r = bar.getBoundingClientRect(), z = zone.getBoundingClientRect();
      return r.left + r.width / 2 > z.left + 3 && r.left + r.width / 2 < z.right - 3;
    });
    if (inZone) break;
    await page.waitForTimeout(15);
  }
  await page.keyboard.press(' ');
  await page.waitForTimeout(500);
  await shot('resultado');
  await ctx.close();
}
// 3) Casa de Pesca e mapa
{
  const { ctx, shot, hold, tap, page } = await open('casa-pesca', '?zona=lago&pos=6,16');
  await hold('ArrowUp', 500);
  await page.waitForTimeout(500);
  await shot('quadro');
  await page.getByText('ÁLBUM', { exact: false }).first().click();
  await page.waitForTimeout(300);
  await shot('album');
  await tap('Escape');
  await tap('m');
  await shot('mapa');
  await ctx.close();
}
// 4) Fazenda: arar, plantar, regar; bichos; barraca de sementes
{
  const ctx0 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx0.addInitScript(() => {
    if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', JSON.stringify({ coins: 80, itens: { 'semente:cenoura': 5, 'semente:milho': 3 } }));
  });
  const page = await ctx0.newPage();
  page.on('pageerror', e => errors.push(`fazenda: ${e.message}`));
  const shot = n => page.screenshot({ path: `${S}/fazenda-${n}.png` });
  const tap = async key => { await page.keyboard.down(key); await page.waitForTimeout(key.startsWith('Arrow') ? 90 : 30); await page.keyboard.up(key); await page.waitForTimeout(450); };
  await page.goto(`${base}/cidade-demo?zona=fazenda&pos=33,17`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await shot('campo');
  await tap('ArrowDown'); await tap(' '); await tap(' '); await tap(' ');
  await page.waitForTimeout(300);
  await shot('plantou');
  await page.goto(`${base}/cidade-demo?zona=fazenda&pos=12,11`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot('bichos');
  await page.goto(`${base}/cidade-demo?zona=fazenda&pos=55,18`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await tap('ArrowUp'); await tap(' ');
  await shot('sementes');
  await page.goto(`${base}/cidade-demo?zona=fazenda&pos=40,28&hora=19.5`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await shot('tarde');
  await ctx0.close();
}
// 5) Cidade WIT: chegada pelo Centro, praça com o telão, WIT-Bot, noite com postes inteligentes, Núcleo
{
  const { ctx, shot, hold, page } = await open('wit', '?pos=31,45');
  await hold('ArrowDown', 700);
  await page.waitForTimeout(1500);
  await shot('chegou');
  await ctx.close();
}
{
  const { ctx, shot } = await open('wit-praca', '?zona=wit&pos=35,23');
  await shot('telao');
  await ctx.close();
}
{
  const { ctx, shot, hold } = await open('wit-noite', '?zona=wit&pos=24,13&hora=21');
  await shot('postes');
  await hold('ArrowRight', 1500);
  await shot('postes-andando');
  await ctx.close();
}
{
  const { ctx, shot, hold, page } = await open('wit-nucleo', '?zona=wit&pos=31,13');
  await hold('ArrowUp', 400);
  await page.waitForTimeout(500);
  await shot('cursos');
  await ctx.close();
}
// 6) noite no lago e celular
{
  const { ctx, shot } = await open('lago-noite', '?zona=lago&pos=24,20&hora=21.5');
  await shot('praca');
  await ctx.close();
}
{
  const { ctx, shot } = await open('lago-celular', '?zona=lago&pos=30,21', { width: 844, height: 390 }, true);
  await shot('cais');
  await ctx.close();
}
console.log(errors.length ? 'ERROS:\n' + errors.join('\n') : 'sem erros no console');
await browser.close();
