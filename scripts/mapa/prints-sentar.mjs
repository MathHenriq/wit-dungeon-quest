// Prints de todo lugar em que o boneco senta: mesas da Torre (3 alturas), Arena
// (jogador numa mesa livre), Oficina (mesas de troca), banco da praça e barco.
//   node scripts/mapa/prints-sentar.mjs <pasta> [url-base]   (com o vite rodando)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
async function run(name, query, steps, viewport = { width: 1280, height: 720 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(`${base}/cidade-demo${query}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  for (const s of steps) {
    if (s.key) { await page.keyboard.down(s.key); await page.waitForTimeout(s.ms ?? 90); await page.keyboard.up(s.key); await page.waitForTimeout(350); }
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.shot) await page.screenshot({ path: `${S}/${name}-${s.shot}.png`, clip: s.clip });
  }
  await ctx.close();
}
for (const andar of [1, 3, 5, 45, 90]) await run(`torre${andar}`, `?sala=torre&andar=${andar}`, [{ key: 'ArrowUp', ms: 1500 }, { shot: 'mesas' }, { key: 'ArrowUp', ms: 900 }, { shot: 'chefe' }]);
for (const k of [1, 2, 3]) await run(`arena-sentado${k}`, `?sala=arena&sentar=${k}`, [{ shot: 'mesa' }]);
await run('arena', '?sala=arena', [{ key: 'ArrowUp', ms: 1400 }, { shot: 'meio' }]);
for (const k of [1, 2]) await run(`oficina-sentado${k}`, `?sala=oficina&sentar=${k}`, [{ shot: 'mesa' }]);
await run('banco', '?pos=25,23', [{ key: 'ArrowUp' }, { key: ' ', ms: 30 }, { wait: 400 }, { shot: 'sentado' }]);
await run('barco', '?zona=lago&pos=32,21', [{ key: 'ArrowRight' }, { key: ' ', ms: 30 }, { wait: 500 }, { shot: 'embarcou' }, { key: 'ArrowRight', ms: 1200 }, { shot: 'navegando' }]);
await browser.close();
console.log(errors.length ? errors.join('\n') : 'sem erros no console');
