// Sequência de quadros do duelo com o inimigo começando: abertura (VS, moeda,
// quem começa), a carta do inimigo no meio e o voo dela até o cemitério.
//   node scripts/mapa/prints-duelo-tempo.mjs <pasta> [url-base]   (vite rodando)
import { chromium } from 'playwright-core';
const S = process.argv[2], base = process.argv[3] ?? 'http://127.0.0.1:5199';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
await page.goto(`${base}/cidade-demo?sala=torre&andar=1&duelo=2&comeca=ele`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.getByText('DUELAR!').click();
const t0 = Date.now();
for (let k = 0; k < 64; k++) {
  await page.screenshot({ path: `${S}/t${String(Date.now() - t0).padStart(5, '0')}.png` });
  await page.waitForTimeout(150);
}
await browser.close();
