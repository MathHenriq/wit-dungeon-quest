// Prints dos interiores (Torre e Sua Casa, com o modo DECORAR).
//   node scripts/mapa/prints-interiores.mjs <pasta> [url-base]
// Precisa do vite rodando (127.0.0.1:5199).
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
async function run(name, query, steps, viewport = { width: 1280, height: 720 }, touch = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(`${base}/cidade-demo${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  for (const s of steps) {
    if (s.key) { await page.keyboard.down(s.key); await page.waitForTimeout(s.ms ?? 400); await page.keyboard.up(s.key); await page.waitForTimeout(300); }
    if (s.press) { await page.keyboard.press(s.press); await page.waitForTimeout(400); }
    if (s.click) { await page.getByText(s.click, { exact: true }).first().click(); await page.waitForTimeout(500); }
    if (s.at) { await page.mouse.move(s.at[0], s.at[1]); await page.waitForTimeout(200); if (!s.hover) await page.mouse.click(s.at[0], s.at[1]); await page.waitForTimeout(400); }
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.shot) await page.screenshot({ path: `${S}/${name}-${s.shot}.png` });
  }
  await ctx.close();
}
await run('torre1', '?sala=torre&andar=1', [
  { shot: 'entrada' },
  { key: 'ArrowUp', ms: 1500 }, { shot: 'meio' },
  { key: 'ArrowUp', ms: 900 }, { shot: 'chefe' },
]);
await run('torre1b', '?sala=torre&andar=1', [
  { key: 'ArrowUp', ms: 500 }, { key: 'ArrowLeft', ms: 900 }, { key: 'ArrowUp', ms: 300 }, { press: ' ' }, { shot: 'conversa' },
]);
await run('torre45', '?sala=torre&andar=45', [{ key: 'ArrowUp', ms: 1600 }, { shot: 'pedra' }]);
await run('torre90', '?sala=torre&andar=90', [{ key: 'ArrowUp', ms: 1600 }, { shot: 'real' }]);
await run('casa', '?sala=casa', [
  { shot: 'entrada' },
  { click: 'DECORAR' }, { shot: 'decorar' },
  { click: 'Tapetes' }, { click: 'Tapete estrela' }, { at: [752, 216], hover: true }, { shot: 'segurando' },
  { at: [752, 216] }, { click: 'Sofás' }, { click: 'Sofá nuvem' }, { press: 'r' }, { at: [496, 312], hover: true }, { shot: 'girando' }, { at: [496, 312] }, { shot: 'posto' },
  { click: 'PRONTO' }, { wait: 300 }, { shot: 'pronto' },
]);
await run('celular', '?sala=casa', [{ shot: 'casa' }, { click: 'DECORAR' }, { click: 'Camas' }, { shot: 'decorar' }], { width: 390, height: 844 }, true);
await run('celular2', '?sala=torre&andar=1', [{ shot: 'torre' }], { width: 390, height: 844 }, true);
await run('fluxo', '?pos=31,16', [
  { key: 'ArrowUp', ms: 900 }, { wait: 1500 }, { shot: 'entrou' },
  { key: 'ArrowDown', ms: 700 }, { wait: 800 }, { shot: 'saiu' },
]);
await run('visual', '?visual', [{ shot: 'pets' }]);
for (const sala of ['arena', 'treino', 'loja', 'oficina', 'castelo']) {
  await run(sala, `?sala=${sala}`, [{ shot: 'entrada' }, { key: 'ArrowUp', ms: 1400 }, { shot: 'meio' }]);
}
await run('portal', '?sala=arena', [
  { key: 'ArrowUp', ms: 250 }, { key: 'ArrowRight', ms: 2300 }, { key: 'ArrowUp', ms: 900 }, { wait: 1500 }, { shot: 'treino' }, { key: 'ArrowDown', ms: 1000 }, { wait: 1500 }, { shot: 'volta' },
]);
await browser.close();
console.log(errors.length ? errors.join('\n') : 'sem erros no console');
