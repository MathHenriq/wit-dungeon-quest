// Prints do shopping (clientes passeando) em vários momentos.
//   node scripts/mapa/prints-loja.mjs <pasta> [url-base]   (com o vite rodando)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })).newPage();
await page.goto(`${base}/cidade-demo?sala=loja`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(900); await page.keyboard.up('ArrowUp');
for (let k = 0; k < 4; k++) { await page.waitForTimeout(5000); await page.screenshot({ path: `${S}/loja-${k}.png` }); }
await browser.close();
