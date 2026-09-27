// Prints da cidade jogável (PC e celular).  node scripts/mapa/prints-cidade.mjs <pasta> [url-base]
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errors = [];
async function run(name, viewport, steps, touch = false) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await page.goto(`${base}/cidade-demo`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  for (const s of steps) {
    if (s.key) { await page.keyboard.down(s.key); await page.waitForTimeout(s.ms ?? 400); await page.keyboard.up(s.key); await page.waitForTimeout(250); }
    if (s.press) { await page.keyboard.press(s.press); await page.waitForTimeout(400); }
    if (s.shot) await page.screenshot({ path: `${S}/${name}-${s.shot}.png` });
  }
  await ctx.close();
}
await run('pc', { width: 1280, height: 720 }, [
  { shot: 'inicio' },
  { key: 'ArrowDown', ms: 700 }, { key: 'ArrowLeft', ms: 2200 }, { shot: 'andando' },
  { key: 'ArrowUp', ms: 250 }, { shot: 'virou' },
]);
await run('pc2', { width: 1280, height: 720 }, [
  { key: 'ArrowLeft', ms: 900 }, { press: ' ' }, { shot: 'conversa' },
]);
await run('pc3', { width: 1280, height: 720 }, [
  { key: 'ArrowUp', ms: 700 }, { shot: 'porta' },
]);
await run('celular', { width: 390, height: 844 }, [{ shot: 'inicio' }], true);
console.log(errors.length ? 'ERROS:\n' + errors.join('\n') : 'sem erros no console');
await browser.close();
