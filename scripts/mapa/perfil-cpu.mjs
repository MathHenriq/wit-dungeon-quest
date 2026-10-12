// Perfil de CPU da cidade (servidor de dev em 127.0.0.1:5199, CPU 4x mais lenta).
//   node scripts/mapa/perfil-cpu.mjs [hora]   → funções que mais gastam tempo em 5 s
import { chromium } from 'playwright-core';
const hora = process.argv[2] ?? '22';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.goto(`http://127.0.0.1:5199/cidade-demo?passeio=1&hora=${hora}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await cdp.send('Profiler.start');
await page.waitForTimeout(5000);
const { profile } = await cdp.send('Profiler.stop');
const byId = new Map(profile.nodes.map(n => [n.id, n]));
const self = new Map();
const dt = profile.timeDeltas;
profile.samples.forEach((id, i) => {
  const n = byId.get(id); const f = n.callFrame;
  const key = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`;
  self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0) / 1000);
});
const total = [...self.values()].reduce((a, b) => a + b, 0);
console.log('total ms', total.toFixed(0));
console.log([...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18).map(([k, v]) => `${v.toFixed(0).padStart(6)}  ${k}`).join('\n'));
await browser.close();
