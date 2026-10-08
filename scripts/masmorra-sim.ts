/**
 * Simula portais com um robô: foge dos avisos no chão (esquiva quando está
 * dentro de um), usa a espada de perto e o tiro de longe (ou só um dos dois),
 * solta as cartas quando recarregam, desce a escada e escolhe a 1ª bênção.
 * Mostra vitória, duração, vida perdida e golpes levados por rank e estilo.
 *   npx vite-node scripts/masmorra-sim.ts [partidas]
 * Ajustar: ENEMY/hpMult em src/game/dungeon.ts, armas em dungeon-weapons.ts.
 */
import { chooseBuff, doorTile, neighbor, NO_INPUT, startRun, stepRun, type Input, type Run, type Side } from '../src/game/dungeon';
import { hunterStats } from '../src/game/hunter';
import { skillOf } from '../src/game/dungeon-skills';
import { CATALOG } from '../src/lib/tcg/cards/catalog';

const N = Number(process.argv[2] ?? 30);
type Style = 'misto' | 'espada' | 'tiro';
const segD = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => { const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)); return Math.hypot(px - x1 - dx * t, py - y1 - dy * t); };

function bot(run: Run, style: Style): Input {
  const p = run.p;
  const danger = run.warns.find(w => w.dmg > 0 || w.kind === 'line') && run.warns.find(w => (w.kind === 'circle' ? Math.hypot(p.x - w.x, p.y - w.y) < w.r + 0.5 : segD(p.x, p.y, w.x, w.y, w.x2, w.y2) < w.r + 0.5));
  if (run.enemies.length) {
    const e = run.enemies.reduce((a, b) => (Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b));
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
    const melee = style === 'espada' || (style === 'misto' && d < 2.2);
    const hand = melee ? 0 : 1;
    const want = melee ? 1.2 : 4.5;
    const k = d > want ? 1 : d < want - 0.8 ? -1 : 0;
    const skill = p.skillCd.findIndex(c => c <= 0);
    return {
      ...NO_INPUT, mx: (dx / d) * k + (-dy / d) * 0.5, my: (dy / d) * k + (dx / d) * 0.5,
      attack: true, dodge: !!danger, swap: p.hand !== hand, skill: skill >= 0 && d < 6 ? skill : undefined,
    };
  }
  if (run.d.rooms[run.room].kind === 'fim') {
    const dx = 8.5 - p.x, dy = 5.5 - p.y, d = Math.hypot(dx, dy) || 1;
    return { ...NO_INPUT, mx: dx / d, my: dy / d };
  }
  // caminho pelas salas: até a mais perto ainda não vista; se viu todas, até o fim
  const prev = new Map<number, [number, Side]>([[run.room, [-1, 'n']]]), q = [run.room];
  let goal = -1;
  while (q.length) {
    const c = q.shift()!;
    if (c !== run.room && (!run.seen[c] || (run.seen.every(Boolean) && c === run.d.end))) { goal = c; break; }
    for (const sd of run.d.rooms[c].doors) { const nb = neighbor(run.d, c, sd); if (nb >= 0 && !prev.has(nb)) { prev.set(nb, [c, sd]); q.push(nb); } }
  }
  if (goal < 0) goal = run.d.end;
  let step = goal, s: Side = run.d.rooms[run.room].doors[0];
  while (prev.has(step) && prev.get(step)![0] !== -1) { const [from, sd] = prev.get(step)!; if (from === run.room) { s = sd; break; } step = from; }
  const [tx, ty] = doorTile(s);
  const gx = tx + 0.5 + (s === 'e' ? 1 : s === 'w' ? -1 : 0), gy = ty + 0.5 + (s === 's' ? 1 : s === 'n' ? -1 : 0);
  const dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy) || 1;
  return { ...NO_INPUT, mx: dx / d, my: dy / d };
}

const skills = CATALOG.filter(c => c.type === 'attack' && c.rarity === 'rare').slice(0, 4).map(c => skillOf(c)!).filter(Boolean);
for (const style of (process.env.ESTILO ? [process.env.ESTILO] : ['misto', 'espada', 'tiro']) as Style[]) {
  console.log(`\n── estilo: ${style}`);
  for (const rank of [0, 1, 2, 3, 4, 5]) {
    let win = 0, time = 0, hurt = 0, floors = 0, timeout = 0;
    for (let k = 0; k < N; k++) {
      const st = hunterStats(rank);
      let run = startRun({ seed: k * 977 + rank * 13, rank, hearts: st.hearts, armor: st.armor, mana: st.mana, skills: skills.slice(0, st.slots) });
      while (!run.result && run.t < 900) {
        if (run.choice) { run = chooseBuff(run, run.choice[0]); continue; }
        const inp = bot(run, style);
        run = stepRun(run, inp, 0.05);
        if (inp.swap) run = stepRun(run, { ...inp, swap: false }, 0.0001);
      }
      if (run.result === 'win') win++;
      if (!run.result) timeout++;
      if (!run.result && process.env.DBG) console.log('  travou', k, 'andar', run.floor, 'sala', run.room, run.d.rooms[run.room].kind, 'inimigos', run.enemies.length, run.enemies.map(e => `${e.kind}@${e.x.toFixed(1)},${e.y.toFixed(1)}`).join(' '), 'p', run.p.x.toFixed(1), run.p.y.toFixed(1), 'portas', run.d.rooms[run.room].doors.join(''), 'limpa', run.cleared[run.room], 'onda', run.wave, 'spawns', run.d.rooms[run.room].spawns.length);
      time += run.t; hurt += run.hurtCount; floors += run.floor;
    }
    console.log(`rank ${'EDCBAS'[rank]}: vitória ${String(Math.round((win / N) * 100)).padStart(3)}% · ${Math.round(time / N / 60 * 10) / 10} min · andar médio ${(floors / N).toFixed(1)} · golpes levados ${(hurt / N).toFixed(1)} · travou ${timeout}`);
  }
}
