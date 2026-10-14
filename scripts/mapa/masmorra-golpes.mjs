// Tiras de quadros dos golpes do caçador na masmorra (modo teste, câmera lenta
// pelo window.__dungeonTime do dev). Precisa do vite em 127.0.0.1:5199.
//   node scripts/mapa/masmorra-golpes.mjs <pasta> [modelo-01|modelo-03...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? 'masmorra-golpes', modelo = process.argv[3] ?? 'modelo-01', URL = 'http://127.0.0.1:5199';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1280, height: 760 } });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/net::|cert|favicon|supabase|404|Failed to fetch/i.test(m.text())) errs.push(m.text().slice(0, 200)); });
const wait = ms => pg.waitForTimeout(ms);
await pg.goto(`${URL}/cidade-demo?sala=treino`, { waitUntil: 'networkidle' });
await pg.evaluate(m => { localStorage.setItem('wit.visual', JSON.stringify({ modelo: m, pele: 'pele-3', cabelo: 'castanho', cima: 'vermelho', baixo: 'jeans' })); }, modelo);
const edit = (fn, arg) => pg.evaluate(async ({ fn, arg }) => {
  const m = await import('/src/game/dungeon.ts');
  const f = new Function('m', 'arg', `return (r) => (${fn})(r, m, arg)`)(m, arg);
  window.__dungeonEdit(f);
}, { fn: fn.toString(), arg });
async function open(rank) {
  await pg.goto(`${URL}/cidade-demo?sala=treino&masmorra=${rank}&teste`, { waitUntil: 'networkidle' });
  await wait(1800);
}
// sala vazia com 2 goblins parados ao lado (não atacam), caçador no meio
const setup = (r, m) => {
  const room = r.d.rooms.findIndex(x => x.kind === 'normal');
  const rooms = r.d.rooms.map((x, i) => (i === room ? { ...x, spawns: [], haz: [] } : x));
  const e1 = { ...m.newEnemy(r, 'goblin', 9.6, 5.6), cd: 99, cardCd: 99, hp: 900, max: 900 }, e2 = { ...m.newEnemy(r, 'golem', 9.4, 4.4), cd: 99, cardCd: 99, hp: 900, max: 900 };
  return { ...r, room, d: { ...r.d, rooms }, cleared: r.cleared.map((c, i) => (i === room ? false : c)), enemies: [e1, e2], shots: [], warns: [], p: { ...r.p, x: 7.6, y: 5.4, face: 'e' } };
};
async function clip(name) {
  const box = await pg.evaluate(() => { const c = document.querySelector('.dg-wrap canvas'); const r = c.getBoundingClientRect(); const p = window.__dungeon.p; const k = r.width / c.width; return { x: r.left + (p.x * 32 - 110) * k, y: r.top + (p.y * 32 - 100) * k, w: 220 * k, h: 150 * k }; });
  await pg.screenshot({ path: `${out}/${name}.png`, clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
}
await open(0);
await pg.screenshot({ path: `${out}/00-sala-e.png` });
for (const r of [1, 2, 3, 4, 5]) { await open(r); await pg.screenshot({ path: `${out}/0${r}-sala-${'edcbas'[r]}.png` }); }
await open(0);
await edit(setup);
await wait(300);
await clip('10-parado');
const slow = k => pg.evaluate(v => { window.__dungeonTime = v; }, k);
const K = 0.08, at = ms => wait(ms / K);   // espera em tempo do jogo
// combo de 3 (câmera lenta): quadros aos 20, 60, 110 e 170 ms de cada golpe
await slow(K);
for (let g = 0; g < 3; g++) {
  await pg.keyboard.down('j'); await wait(60); await pg.keyboard.up('j');
  let t = 0;
  for (const [f, ms] of [20, 60, 110, 170].entries()) { await at(ms - t); t = ms; await clip(`1${g + 1}-combo${g + 1}-${f}`); }
  await at(260);
}
await slow(1);
// pesado: segura e solta (câmera lenta depois de soltar)
await pg.keyboard.down('j'); await wait(400); await clip('20-pesado-carregando'); await wait(350); await clip('21-pesado-cheio');
await slow(K); await pg.keyboard.up('j');
{ let t = 0; for (const [f, ms] of [25, 80, 150, 250].entries()) { await at(ms - t); t = ms; await clip(`22-pesado-${f}`); } }
await slow(1); await wait(500);
await edit(setup); await wait(200);
// esquiva para cima (cambalhota), câmera lenta
await slow(K);
await pg.keyboard.down('w'); await wait(150); await pg.keyboard.down('k'); await wait(80); await pg.keyboard.up('k');
{ let t = 0; for (const [f, ms] of [15, 45, 75, 105, 140, 175].entries()) { await at(ms - t); t = ms; await clip(`30-esquiva-${f}`); } }
await pg.keyboard.up('w');
await slow(1); await wait(500);
await edit(setup); await wait(200);
// investida: esquiva para a direita e ataca logo (câmera lenta)
await slow(K);
await pg.keyboard.down('d'); await wait(150); await pg.keyboard.down('k'); await wait(80); await pg.keyboard.up('k'); await pg.keyboard.up('d');
await at(200);
await pg.keyboard.down('j'); await wait(80); await pg.keyboard.up('j');
{ let t = 0; for (const [f, ms] of [20, 60, 110, 180].entries()) { await at(ms - t); t = ms; await clip(`40-investida-${f}`); } }
await slow(1); await wait(500);
await edit(setup); await wait(200);
// tiro: troca para a arma longa e atira
await pg.keyboard.press('q'); await wait(200);
await slow(K);
await pg.keyboard.down('j'); await wait(80);
{ let t = 0; for (const [f, ms] of [15, 45, 90].entries()) { await at(ms - t); t = ms; await clip(`5${f}-tiro-${f}`); } }
await pg.keyboard.up('j');
await slow(1); await wait(300);
// aviso de inimigo: deixa um goblin atacar
await edit((r, m) => ({ ...r, enemies: [{ ...m.newEnemy(r, 'goblin', 9.2, 5.4), hp: 900, max: 900 }, { ...m.newEnemy(r, 'arqueiro', 12, 3), hp: 900, max: 900 }], p: { ...r.p, hp: 99, max: 99 } }));
for (let f = 0; f < 8; f++) { await wait(140); await clip(`60-inimigo-${f}`); }
console.log('erros:', JSON.stringify(errs));
await b.close();
