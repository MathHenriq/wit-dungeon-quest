// Prints da Comunicação (câmera, foto no telão, escrever matéria, jornalzinho)
// e da IA (robô gari catando lixo, programar o robô com blocos).
//   node scripts/mapa/prints-trabalho3.mjs <pasta> [ia]   (com o vite rodando em 127.0.0.1:5199)
import { chromium } from 'playwright-core';
const S = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => { if (!localStorage.getItem('wit.progresso')) localStorage.setItem('wit.progresso', JSON.stringify({ coins: 100, fome: 90 })); });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('ERRO', e.message));
const onlyIa = process.argv[3] === 'ia';
// robô gari na praça da Cidade WIT
await page.goto('http://127.0.0.1:5199/cidade-demo?zona=wit&pos=43,28', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/gari-1.png` });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${S}/gari-2.png` });
// programar o robô
await page.goto('http://127.0.0.1:5199/cidade-demo?zona=wit&trabalho=lab-ia', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'TRABALHAR' }).click(); await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/robo-1.png` });
const blk = n => page.locator('button', { hasText: n }).first();
// fase 1 (o tabuleiro pode vir espelhado: lê a direção pela posição do robô)
const mirrored = await page.evaluate(() => { const im = document.querySelector('img[alt="robô"]'); return parseFloat(im.style.left) > 100; });
for (const b of ['ANDAR', 'ANDAR', 'PEGAR', mirrored ? 'DIR' : 'ESQ', 'ANDAR', 'ANDAR', 'PEGAR']) { await blk(b).click(); await page.waitForTimeout(60); }
await page.screenshot({ path: `${S}/robo-2.png` });
await page.getByRole('button', { name: 'RODAR' }).click(); await page.waitForTimeout(1300);
await page.screenshot({ path: `${S}/robo-3.png` });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/robo-4.png` });
await page.getByRole('button', { name: 'PRÓXIMA FASE' }).click(); await page.waitForTimeout(300);
await blk('REPETIR').click(); for (const b of ['ANDAR', 'ANDAR', 'PEGAR']) { await blk(b).click(); await page.waitForTimeout(60); }
await page.screenshot({ path: `${S}/robo-5.png` });
await page.getByRole('button', { name: 'RODAR' }).click(); await page.waitForTimeout(2600);
await page.screenshot({ path: `${S}/robo-6.png` });
if (onlyIa) { await browser.close(); process.exit(0); }
// fotos: perto do Estúdio e na praça
for (const pos of ['42,13', '20,30', '35,21']) {
  await page.goto(`http://127.0.0.1:5199/cidade-demo?zona=wit&pos=${pos}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.keyboard.press('f'); await page.waitForTimeout(250);
}
await page.screenshot({ path: `${S}/foto-1.png` });
// espera a vez da foto no telão (10 s a 16 s de cada 16 s)
const wait = await page.evaluate(() => { const m = Date.now() % 16000; return m < 10600 ? 10600 - m : 16000 - m + 10600; });
await page.waitForTimeout(wait + 300);
await page.screenshot({ path: `${S}/foto-2-telao.png` });
// escrever matéria
await page.goto('http://127.0.0.1:5199/cidade-demo?zona=wit&trabalho=estudio', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${S}/materia-0.png` });
await page.getByRole('button', { name: 'TRABALHAR' }).click(); await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/materia-1.png` });
// escolhe a primeira opção de cada parte e uma foto
for (const n of ['QUEM?', 'O QUÊ?', 'ONDE?', 'QUANDO?']) {
  const row = page.locator('div.flex-wrap', { has: page.getByText(n, { exact: true }) }).first();
  await row.locator('button').first().click();
}
await page.locator('img[alt]').first().click().catch(() => {});
await page.waitForTimeout(200);
await page.screenshot({ path: `${S}/materia-2.png` });
await page.getByRole('button', { name: 'PUBLICAR' }).click(); await page.waitForTimeout(500);
await page.screenshot({ path: `${S}/materia-3.png` });
// jornalzinho (com uma matéria certinha publicada)
await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('wit.progresso'));
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const f = JSON.parse(localStorage.getItem('wit.fotos') || '[]')[0];
  p.materias = [{ day, text: 'Os alunos do Lab de IA ensinaram um robô a catar lixo na Cidade WIT, ontem.', foto: f && f.id }];
  localStorage.setItem('wit.progresso', JSON.stringify(p));
});
await page.goto('http://127.0.0.1:5199/cidade-demo?zona=wit&trabalho=estudio', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.getByRole('button', { name: 'JORNALZINHO' }).click(); await page.waitForTimeout(300);
await page.screenshot({ path: `${S}/jornal-1.png` });
await page.getByRole('button', { name: /COMPRAR/ }).click(); await page.waitForTimeout(400);
await page.screenshot({ path: `${S}/jornal-2.png`, fullPage: true });
await browser.close();
