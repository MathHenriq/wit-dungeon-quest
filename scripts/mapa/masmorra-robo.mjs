// Robô da masmorra: abre a Associação, entra no portal do rank pedido e joga
// com o teclado (foge do vermelho no chão, espada de perto, tiro de longe,
// cartas 1–4, anda pelas salas até a escada/chefe, escolhe a 1ª bênção).
// Tira prints pelo caminho e junta os erros do navegador. Precisa do vite em
// 127.0.0.1:5199 (o dev expõe window.__dungeon).
//   node scripts/mapa/masmorra-robo.mjs <pasta> [rank 0-5] [LxA]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = process.argv[2] ?? 'masmorra-robo', rank = Number(process.argv[3] ?? 0);
const [vw, vh] = (process.argv[4] ?? '1280x760').split('x').map(Number);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: vw, height: vh } });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/net::|cert|favicon|supabase/i.test(m.text())) errs.push(m.text().slice(0, 200)); });
// cartas de habilidade e poções para o teste
await pg.goto('http://127.0.0.1:5199/cidade-demo?sala=treino', { waitUntil: 'networkidle' });
await pg.evaluate(rank => {
  const p = JSON.parse(localStorage.getItem('wit.progresso') || '{}');
  p.itens = { ...(p.itens || {}), 'pocao:vida': 2, 'pocao:mana': 1 };
  p.towerMax = Math.max(p.towerMax ?? 1, [1, 10, 25, 45, 70, 90][rank]);   // abre o portal pedido
  localStorage.setItem('wit.progresso', JSON.stringify(p));
}, rank);
await pg.goto('http://127.0.0.1:5199/cidade-demo?sala=treino&associacao=cacador', { waitUntil: 'networkidle' });
await pg.waitForTimeout(1500);
// escolhe as 2 primeiras cartas da lista
const cards = pg.locator('.sys-grid button.sys-cell');
for (let k = 0; k < 2 && k < await cards.count(); k++) { await cards.nth(k).click(); await pg.waitForTimeout(150); }
await pg.screenshot({ path: `${out}/0-cacador.png` });
await pg.locator('.sys-tab', { hasText: 'PORTAIS' }).click(); await pg.waitForTimeout(300);
await pg.screenshot({ path: `${out}/1-portais.png` });
await pg.locator('.sys-cell').nth(rank).locator('button', { hasText: 'ENTRAR' }).click();
await pg.waitForTimeout(2000);

const held = new Set();
const setKeys = async want => {
  for (const k of [...held]) if (!want.has(k)) { await pg.keyboard.up(k); held.delete(k); }
  for (const k of want) if (!held.has(k)) { await pg.keyboard.down(k); held.add(k); }
};
let shot = 0, lastShot = 0, t0 = Date.now(), result = null, floor = 1;
while (Date.now() - t0 < 240_000) {
  const st = await pg.evaluate(() => {
    const r = window.__dungeon; if (!r) return null;
    const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const p = r.p;
    const e = r.enemies.reduce((a, x) => (!a || near(x, p) < near(a, p) ? x : a), null);
    const danger = r.warns.some(w => (w.kind === 'circle' ? Math.hypot(p.x - w.x, p.y - w.y) < w.r + 0.6 : (() => { const dx = w.x2 - w.x, dy = w.y2 - w.y, l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p.x - w.x) * dx + (p.y - w.y) * dy) / l)); return Math.hypot(p.x - w.x - dx * t, p.y - w.y - dy * t) < w.r + 0.6; })()));
    // caminho pelas salas
    const STEP = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
    const nb = (i, s) => { const rm = r.d.rooms[i]; const x = rm.gx + STEP[s][0], y = rm.gy + STEP[s][1]; return rm.doors.includes(s) ? r.d.rooms.findIndex(o => o.gx === x && o.gy === y) : -1; };
    const prev = new Map([[r.room, [-1, 'n']]]), q = [r.room]; let goal = -1;
    while (q.length) { const c = q.shift(); if (c !== r.room && (!r.seen[c] || (r.seen.every(Boolean) && c === r.d.end))) { goal = c; break; } for (const s of r.d.rooms[c].doors) { const n = nb(c, s); if (n >= 0 && !prev.has(n)) { prev.set(n, [c, s]); q.push(n); } } }
    if (goal < 0) goal = r.d.end;
    let step = goal, side = r.d.rooms[r.room].doors[0];
    while (prev.has(step) && prev.get(step)[0] !== -1) { const [from, s] = prev.get(step); if (from === r.room) { side = s; break; } step = from; }
    const door = { n: [8.5, -0.5], s: [8.5, 11.5], e: [17.5, 5.5], w: [-0.5, 5.5] }[side];
    return { px: p.x, py: p.y, hand: p.hand, cds: p.skillCd, e: e && { x: e.x, y: e.y }, danger, kind: r.d.rooms[r.room].kind, cleared: r.cleared[r.room], door, choice: !!r.choice, result: r.result ?? null, floor: r.floor, room: r.room, hp: p.hp };
  });
  if (!st) { await pg.waitForTimeout(200); continue; }
  if (st.result) { result = st.result; break; }
  if (st.choice) { await setKeys(new Set()); await pg.screenshot({ path: `${out}/escolha-andar${st.floor}.png` }); await pg.locator('.sys-choice').first().click(); await pg.waitForTimeout(500); continue; }
  if (st.floor !== floor) { floor = st.floor; }
  const want = new Set();
  let gx, gy;
  if (st.e) {
    const d = Math.hypot(st.e.x - st.px, st.e.y - st.py), melee = d < 2.4;
    if ((melee && st.hand !== 0) || (!melee && st.hand !== 1)) await pg.keyboard.press('q');
    const keep = melee ? 1.1 : 4.5, k = d > keep ? 1 : d < keep - 0.8 ? -1 : 0;
    gx = st.px + (st.e.x - st.px) * k + (st.py - st.e.y) * 0.4; gy = st.py + (st.e.y - st.py) * k + (st.e.x - st.px) * 0.4;
    want.add('j');
    if (st.danger) want.add('k');
    const ready = st.cds.findIndex(c => c <= 0);
    if (ready >= 0 && d < 6) await pg.keyboard.press(String(ready + 1));
  } else if (st.kind === 'fim' && st.cleared) { gx = 8.5; gy = 5.5; }
  else { [gx, gy] = st.door; }
  const dx = gx - st.px, dy = gy - st.py;
  if (dx > 0.2) want.add('d'); if (dx < -0.2) want.add('a'); if (dy > 0.2) want.add('s'); if (dy < -0.2) want.add('w');
  await setKeys(want);
  if (Date.now() - lastShot > 6000) { lastShot = Date.now(); await pg.screenshot({ path: `${out}/jogo-${String(shot++).padStart(2, '0')}.png` }); }
  await pg.waitForTimeout(60);
}
await setKeys(new Set());
await pg.waitForTimeout(2500);
await pg.screenshot({ path: `${out}/fim.png` });
const prog = await pg.evaluate(() => JSON.parse(localStorage.getItem('wit.progresso')).masmorra);
console.log('resultado', result, 'andar', floor, 'caçador', JSON.stringify(prog));
console.log('erros', errs);
writeFileSync(`${out}/relatorio.json`, JSON.stringify({ result, floor, errs, prog }, null, 1));
await b.close();
