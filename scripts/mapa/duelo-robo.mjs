// Robô que joga um duelo inteiro na Torre (clica nas cartas jogáveis, JOGAR,
// e passa a vez com ESPAÇO), tira um print a cada passo e junta os erros.
//   node scripts/mapa/duelo-robo.mjs <pasta> [andar] [mesa|chefe]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? 'duelo-robo', andar = process.argv[3] ?? '1', mesa = process.argv[4] ?? '3';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/ERR_CERT|Failed to load/.test(m.text())) errs.push(m.text().slice(0, 200)); });
await pg.goto(`http://127.0.0.1:5199/cidade-demo?sala=torre&andar=${andar}&duelo=${mesa}&jogar&comeca=eu`, { waitUntil: 'networkidle' });
await pg.waitForTimeout(9000);
let step = 0, plays = 0, turns = 0;
const shot = async (tag) => pg.screenshot({ path: `${out}/${String(step++).padStart(3, '0')}-${tag}.png` });
for (let i = 0; i < 80; i++) {
  const txt = await pg.evaluate(() => document.body.innerText);
  if (/VITÓRIA|DERROTA|VOCÊ VENCEU|VOCÊ PERDEU/i.test(txt) && /MOEDAS|CONTINUAR|VOLTAR|SAIR/.test(txt) && !(await pg.locator('.dv-hand .c.ok').count())) {
    await pg.waitForTimeout(2500); await shot('fim'); console.log('FIM:', txt.match(/VITÓRIA|DERROTA|VENCEU|PERDEU/i)?.[0]); break;
  }
  const ok = pg.locator('.dv-hand .c.ok');
  if (await ok.count()) {
    await ok.first().click(); await pg.waitForTimeout(500);
    const jogar = pg.locator('button', { hasText: /^JOGAR$/ });
    if (await jogar.count()) { await jogar.first().click(); plays++; }
    await pg.waitForTimeout(700);
    // escolher cartas para pagar (descartar): pega as primeiras que dá e confirma
    if (await pg.locator('.dv-hand .c.pick, .dv-hand .c:not(.dim)').count() && /ESCOLHA|DESCART|CONFIRMAR/i.test(await pg.evaluate(() => document.body.innerText))) {
      const cands = pg.locator('.dv-hand .c:not(.dim)');
      for (let k = 0; k < 3 && k < await cands.count(); k++) await cands.nth(k).click().catch(() => undefined);
      await pg.locator('button', { hasText: /CONFIRMAR|PAGAR|OK/ }).first().click().catch(() => undefined);
      await pg.waitForTimeout(700);
    }
    await pg.waitForTimeout(1600);
    if (i % 2 === 0) await shot('jogou');
    // modal aberta ainda (não deu para jogar)? fecha
    if (await pg.locator('.dv-modal').count()) { await pg.keyboard.press('Escape'); await pg.mouse.click(20, 400); }
    continue;
  }
  await pg.keyboard.press(' '); turns++;
  await pg.waitForTimeout(4500);
  await shot('turno');
}
console.log(`jogadas ${plays} · turnos ${turns} · erros ${errs.length}`);
for (const e of [...new Set(errs)].slice(0, 10)) console.log('  ', e);
await b.close();
