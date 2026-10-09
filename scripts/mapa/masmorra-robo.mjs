// Robô da masmorra no navegador. Precisa do vite em 127.0.0.1:5199 (o dev
// expõe window.__dungeon e window.__dungeonEdit).
//   node scripts/mapa/masmorra-robo.mjs <pasta> [rank 0-5] [LxA] [modo]
// modo "jogar" (padrão): entra no portal e joga com o teclado (foge do vermelho,
//   combo tocando o J, cartas 1–4, L, anda pelas salas, escolhe a 1ª bênção).
// modo "vitrine": prints dos golpes marcantes (tornado de fogo, Zoltraak, Titã
//   Colossal, água + gelo, carta virando no inimigo) e do chefe de cada rank.
// Junta os erros do navegador em relatorio.json.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = process.argv[2] ?? 'masmorra-robo', rank = Number(process.argv[3] ?? 0);
const [vw, vh] = (process.argv[4] ?? '1280x760').split('x').map(Number);
const modo = process.argv[5] ?? 'jogar';
const URL = 'http://127.0.0.1:5199';
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: vw, height: vh }, hasTouch: vw < 900, isMobile: vw < 900 });
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type() === 'error' && !/net::|cert|favicon|supabase|404/i.test(m.text())) errs.push(m.text().slice(0, 200)); });
const wait = ms => pg.waitForTimeout(ms);
const shot = name => pg.screenshot({ path: `${out}/${name}.png` });

// progresso de teste: todos os portais abertos, cartas e poções
const CARTAS = ['howitzer-impact', 'zoltraak', 'tita-colossal', 'respiracao-da-agua', 'bola-de-neve', 'kamehameha'];
await pg.goto(`${URL}/cidade-demo?sala=treino`, { waitUntil: 'networkidle' });
await pg.evaluate(({ rank, CARTAS, modo }) => {
  const p = JSON.parse(localStorage.getItem('wit.progresso') || '{}');
  p.itens = { ...(p.itens || {}), 'pocao:vida': 2, 'pocao:mana': 1 };
  p.collection = { ...(p.collection || {}) };
  for (const c of CARTAS) p.collection[c] = Math.max(1, p.collection[c] ?? 0);
  p.masmorra = { ...(p.masmorra || {}) };
  p.masmorra.vitorias = [0, 1, 2, 3, 4, 5].map(k => (k < Math.max(rank, modo === 'vitrine' ? 6 : 0) ? 1 : 0));
  p.masmorra.xp = Math.max(p.masmorra.xp ?? 0, 21000);              // rank S: 4 espaços de carta
  p.masmorra.cartas = modo === 'vitrine' ? CARTAS.slice(0, 4) : ['howitzer-impact', 'respiracao-da-agua', 'bola-de-neve', 'zoltraak'];
  p.caminho = p.caminho ?? 'desafiante';
  localStorage.setItem('wit.progresso', JSON.stringify(p));
}, { rank, CARTAS, modo });

async function enter(r) {
  await pg.goto(`${URL}/cidade-demo?sala=treino&associacao=portais`, { waitUntil: 'networkidle' });
  await wait(1200);
  await pg.locator('.sys-cell').nth(r).locator('button', { hasText: 'ENTRAR' }).click();
  await wait(1800);
}
/** Mexe na partida com uma função do motor (import do módulo pelo vite). */
const edit = (fn, arg) => pg.evaluate(async ({ fn, arg }) => {
  const m = await import('/src/game/dungeon.ts');
  // eslint-disable-next-line no-new-func
  const f = new Function('m', 'arg', `return (r) => (${fn})(r, m, arg)`)(m, arg);
  window.__dungeonEdit(f);
}, { fn: fn.toString(), arg });

if (modo === 'vitrine') {
  await pg.goto(`${URL}/cidade-demo?sala=treino&associacao=cartas`, { waitUntil: 'networkidle' });
  await wait(1200); await shot('00-codex');
  await pg.locator('.sys-tab', { hasText: 'STATUS' }).click(); await wait(300); await shot('01-status');
  await pg.locator('.sys-tab', { hasText: 'PORTAIS' }).click(); await wait(300); await shot('02-portais');
  await enter(2);
  // sala de luta com inimigos parados perto, para ver os golpes
  const arena = (r, m, a) => {
    let run = m.warpTo(r, 1, r.d.rooms.findIndex(x => x.kind === 'normal'));
    const e = (k, x, y, extra = {}) => ({ ...m.newEnemy(run, k, x, y), hp: 4000, max: 4000, cd: 99, cardCd: 99, ...extra });
    run = { ...run, p: { ...run.p, x: 5.5, y: 5.5, skillCd: run.p.skillCd.map(() => 0), hp: 99, max: 99 }, enemies: [e('golem', 10.5, 5.5), e('goblin', 12.5, 4), e('lobo', 12, 7.5), ...(a.card ? [e('mago', 14.5, 5.5, { cards: ['bola-de-fogo'], cardCd: 0 })] : [])] };
    return run;
  };
  const cast = async (slot, ms, name, hold = 0) => {
    await pg.keyboard.down(String(slot + 1)); await wait(hold || 60); await pg.keyboard.up(String(slot + 1));
    await wait(ms); await shot(name);
  };
  await edit(arena, {}); await wait(300);
  await cast(0, 450, '10-tornado-de-fogo');
  await wait(1500); await shot('11-tornado-queimando');
  await edit(arena, {}); await wait(300);
  await cast(1, 250, '12-zoltraak-cena');
  await wait(600); await shot('13-zoltraak-feixes');
  await edit(arena, {}); await wait(300);
  await cast(2, 600, '14-tita-colossal');
  await pg.keyboard.down('d'); await wait(900); await pg.keyboard.up('d'); await shot('15-tita-pisando');
  await wait(7500); await shot('16-tita-vapor');
  // água e depois gelo (cartas 4 e 5 do jogo: troca as cartas levadas)
  await edit((r, m) => r, {});
  await pg.evaluate(() => { const p = JSON.parse(localStorage.getItem('wit.progresso')); p.masmorra.cartas = ['respiracao-da-agua', 'bola-de-neve', 'kamehameha', 'zoltraak']; localStorage.setItem('wit.progresso', JSON.stringify(p)); });
  await enter(2);
  await edit(arena, { card: true }); await wait(300);
  await cast(0, 500, '17-agua');
  await cast(1, 250, '18-gelo-congelou');
  await wait(900); await shot('19-carta-virando-no-mago');
  await edit(arena, {}); await wait(300);
  await cast(2, 300, '20-kamehameha-carregado', 1500);
  // um chefe de cada rank
  for (let r = 0; r < 6; r++) {
    await enter(r);
    await edit((run, m) => { const x = m.warpTo(run, 5, 0); const y = m.warpTo(x, 5, x.d.end); return { ...y, p: { ...y.p, hp: 99, max: 99 } }; }, {});
    await pg.keyboard.down('j'); await wait(2500); await pg.keyboard.up('j');
    await wait(1500);
    await shot(`3${r}-chefe-${'edcbas'[r]}`);
  }
} else {
  await enter(rank);
  const held = new Set();
  const setKeys = async want => {
    for (const k of [...held]) if (!want.has(k)) { await pg.keyboard.up(k); held.delete(k); }
    for (const k of want) if (!held.has(k)) { await pg.keyboard.down(k); held.add(k); }
  };
  let n = 0, lastShot = 0, t0 = Date.now(), result = null, floor = 1, tap = false;
  while (Date.now() - t0 < 300_000) {
    const st = await pg.evaluate(() => {
      const r = window.__dungeon; if (!r) return null;
      const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const p = r.p;
      const live = r.enemies.filter(e => e.hp > 0 && e.state !== 'under' && e.ghost <= 0);
      const e = live.reduce((a, x) => (!a || near(x, p) < near(a, p) ? x : a), null);
      const seg = (w) => { const dx = w.x2 - w.x, dy = w.y2 - w.y, l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((p.x - w.x) * dx + (p.y - w.y) * dy) / l)); return Math.hypot(p.x - w.x - dx * t, p.y - w.y - dy * t); };
      const danger = r.warns.some(w => (w.dmg > 0 || w.st) && w.t < 0.2 && (w.kind === 'circle' ? Math.hypot(p.x - w.x, p.y - w.y) < w.r + 0.5 : seg(w) < w.r + 0.5));
      // caminho pelas salas (sem a secreta)
      const STEP = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
      const nb = (i, s) => { const rm = r.d.rooms[i]; const x = rm.gx + STEP[s][0], y = rm.gy + STEP[s][1]; return rm.doors.includes(s) && (s !== rm.secret || r.cracked.includes(i)) ? r.d.rooms.findIndex(o => o.gx === x && o.gy === y) : -1; };
      const allSeen = r.d.rooms.every((x, i) => r.seen[i] || x.kind === 'secreta');
      const prev = new Map([[r.room, [-1, 'n']]]), q = [r.room]; let goal = -1;
      while (q.length) { const c = q.shift(); if (c !== r.room && ((!r.seen[c] && r.d.rooms[c].kind !== 'secreta') || (allSeen && c === r.d.end))) { goal = c; break; } for (const s of r.d.rooms[c].doors) { const n2 = nb(c, s); if (n2 >= 0 && !prev.has(n2)) { prev.set(n2, [c, s]); q.push(n2); } } }
      if (goal < 0) goal = r.d.end;
      let step = goal, side = r.d.rooms[r.room].doors[0];
      while (prev.has(step) && prev.get(step)[0] !== -1) { const [from, s] = prev.get(step); if (from === r.room) { side = s; break; } step = from; }
      const door = { n: [8.5, -0.5], s: [8.5, 11.5], e: [17.5, 5.5], w: [-0.5, 5.5] }[side];
      const kind = r.d.rooms[r.room].kind;
      return { px: p.x, py: p.y, hand: p.hand, cds: p.skillCd, classCd: p.classCd, e: e && { x: e.x, y: e.y }, n: live.length, danger, kind, cleared: r.cleared[r.room], door, choice: !!r.choice, result: r.result ?? null, floor: r.floor };
    });
    if (!st) { await wait(200); continue; }
    if (st.result) { result = st.result; break; }
    if (st.choice) { await setKeys(new Set()); await shot(`escolha-andar${st.floor}`); await pg.locator('.sys-choice').first().click(); await wait(500); continue; }
    floor = st.floor;
    const want = new Set();
    let gx, gy;
    if (st.e) {
      const d = Math.hypot(st.e.x - st.px, st.e.y - st.py), melee = d < 2.4;
      if ((melee && st.hand !== 0) || (!melee && st.hand !== 1)) await pg.keyboard.press('q');
      const keep = melee ? 1.2 : 4.5, k = d > keep ? 1 : d < keep - 0.8 ? -1 : 0;
      gx = st.px + (st.e.x - st.px) * k + (st.py - st.e.y) * 0.4; gy = st.py + (st.e.y - st.py) * k + (st.e.x - st.px) * 0.4;
      tap = !tap;
      if (st.hand === 1 || tap) want.add('j');
      if (st.danger) want.add('k');
      const ready = st.cds.findIndex(c => c <= 0);
      if (ready >= 0 && d < 6) await pg.keyboard.press(String(ready + 1));
      if (st.classCd <= 0 && st.n >= 2) await pg.keyboard.press('l');
    } else if ((st.kind === 'fim' || st.kind === 'elite') && st.cleared) { gx = 8.5; gy = 5.5; }
    else { [gx, gy] = st.door; }
    const dx = gx - st.px, dy = gy - st.py;
    if (dx > 0.2) want.add('d'); if (dx < -0.2) want.add('a'); if (dy > 0.2) want.add('s'); if (dy < -0.2) want.add('w');
    await setKeys(want);
    if (Date.now() - lastShot > 7000) { lastShot = Date.now(); await shot(`jogo-${String(n++).padStart(2, '0')}`); }
    await wait(50);
  }
  await setKeys(new Set());
  await wait(2500);
  await shot('fim');
  console.log('resultado', result, 'andar', floor);
}
const prog = await pg.evaluate(() => JSON.parse(localStorage.getItem('wit.progresso')).masmorra);
console.log('erros', errs);
writeFileSync(`${out}/relatorio.json`, JSON.stringify({ modo, errs, prog: { xp: prog?.xp, vitorias: prog?.vitorias, maestria: prog?.maestria } }, null, 1));
await b.close();
