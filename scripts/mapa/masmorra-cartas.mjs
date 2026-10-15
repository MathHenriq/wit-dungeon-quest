// Tiras de quadros dos golpes de CARTA na masmorra (câmera lenta pelo
// window.__dungeonTime do dev; modo teste). Para cada carta: põe só ela no
// espaço 1, solta e tira 4 quadros. Precisa do vite em 127.0.0.1:5199.
//   node scripts/mapa/masmorra-cartas.mjs <pasta> [carta1,carta2,...]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const out = process.argv[2] ?? 'masmorra-cartas', URL = 'http://127.0.0.1:5199';
// Épica+ com folha própria e Comum–Rara com a folha do elemento
const CARTAS = (process.argv[3] ?? [
  'kamehameha', 'zoltraak', 'howitzer-impact', 'final-flash', 'red-hawk', 'hakka-no-togame', 'fogo-infernal', 'gae-bolg', 'mjolnir', 'katana-parte-alma',
  'bola-de-fogo', 'respiracao-da-agua', 'chicote-dagua', 'tatsumaki', 'sol-nascente', 'estacas-de-gelo', 'cartas-do-hisoka', 'getsuga-tensho', 'lancas-trovao', 'enma',
].join(',')).split(',');
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1280, height: 760 } });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/net::|cert|favicon|supabase|404|Failed to fetch/i.test(m.text())) errs.push(m.text().slice(0, 200)); });
const wait = ms => pg.waitForTimeout(ms);
await pg.goto(`${URL}/cidade-demo?sala=treino`, { waitUntil: 'networkidle' });
await pg.evaluate(() => localStorage.setItem('wit.visual', JSON.stringify({ modelo: 'modelo-01', pele: 'pele-3', cabelo: 'castanho', cima: 'vermelho', baixo: 'jeans' })));
await pg.goto(`${URL}/cidade-demo?sala=treino&masmorra=2&teste`, { waitUntil: 'networkidle' });
await wait(1800);
// sala vazia, 3 inimigos parados à direita, só a carta pedida no espaço 1
const setup = async card => pg.evaluate(async card => {
  const m = await import('/src/game/dungeon.ts');
  const { skillOf } = await import('/src/game/dungeon-skills.ts');
  const { CARD_BY_ID } = await import('/src/lib/tcg/cards/catalog.ts');
  window.__dungeonEdit(r => {
    const room = r.d.rooms.findIndex(x => x.kind === 'normal');
    const rooms = r.d.rooms.map((x, i) => (i === room ? { ...x, spawns: [], haz: [], rocks: [] } : x));
    let run = { ...r, room, d: { ...r.d, rooms }, cleared: r.cleared.map((c, i) => (i === room ? false : c)), shots: [], warns: [], acts: [], queue: [], cine: null };
    const breaks = run.breaks.map((b, i) => (i === room ? [] : b));
    const e = (k, x, y) => ({ ...m.newEnemy(run, k, x, y), hp: 9000, max: 9000, cd: 99, cardCd: 99 });
    const sk = skillOf(CARD_BY_ID.get(card));
    return { ...run, breaks, enemies: [e('golem', 10.5, 5.5), e('goblin', 12, 4.2), e('slime', 12.5, 7)], p: { ...run.p, x: 5, y: 5.5, face: 'e', dx: 1, dy: 0, skills: [sk], skillCd: [0], mp: 999, hp: 99, max: 99, lock: 0, charge: null } };
  });
}, card);
const clip = name => pg.evaluate(() => { const c = document.querySelector('.dg-wrap canvas'); const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })
  .then(bx => pg.screenshot({ path: `${out}/${name}.png`, clip: { x: bx.x, y: bx.y, width: bx.w, height: bx.h } }));
const slow = k => pg.evaluate(v => { window.__dungeonTime = v; }, k);
const K = 0.15, at = ms => wait(ms / K);
for (const [i, card] of CARTAS.entries()) {
  await slow(1); await setup(card); await wait(250);
  await slow(K);
  await pg.keyboard.down('1'); await wait(70); await pg.keyboard.up('1');
  let t = 0;
  for (const [f, ms] of [120, 300, 550, 900].entries()) { await at(ms - t); t = ms; await clip(`${String(i).padStart(2, '0')}-${card}-${f}`); }
}
console.log('erros:', JSON.stringify(errs));
await b.close();
