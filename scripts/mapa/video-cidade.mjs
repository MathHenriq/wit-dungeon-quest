// Grava um vídeo (webm) do passeio automático pela cidade.
//   node scripts/mapa/video-cidade.mjs <pasta-saida> [segundos] [url-base] [extra]
// `extra` vai no fim da URL, ex.: '&hora=16&velocidade=25' (tarde virando noite).
import { chromium } from 'playwright-core';
import { readdirSync, renameSync } from 'node:fs';
const dir = process.argv[2] ?? '.', secs = Number(process.argv[3] ?? 20), base = process.argv[4] ?? 'http://127.0.0.1:5199', extra = process.argv[5] ?? '';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, recordVideo: { dir, size: { width: 960, height: 540 } } });
const page = await ctx.newPage();
await page.goto(`${base}/cidade-demo?passeio=1${extra}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(secs * 1000);
await ctx.close();
await browser.close();
const f = readdirSync(dir).filter(n => n.endsWith('.webm')).sort().pop();
if (f) { renameSync(`${dir}/${f}`, `${dir}/cidade-passeio.webm`); console.log(`${dir}/cidade-passeio.webm`); }
