/**
 * Simula a masmorra com um robô simples: atira (mira automática), foge do
 * inimigo mais perto e, com a sala limpa, vai para a porta da próxima sala
 * ainda não vista (ou da sala do chefe). Mostra vitória, vida que sobra e
 * duração por faixa de andar. Ajuste ENEMY/bossHp em src/game/dungeon.ts.
 *   npx vite-node scripts/masmorra-sim.ts [partidas]
 */
import { doorTile, neighbor, NO_INPUT, startRun, stepRun, type Run, type Side } from '../src/game/dungeon';

const N = Number(process.argv[2] ?? 60);
function bot(run: Run) {
  const p = run.p;
  if (run.enemies.length) {
    const e = run.enemies.reduce((a, b) => (Math.hypot(a.x - p.x, a.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? a : b));
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    // foge se perto, senão anda de lado (círculo)
    const away = d < 3.5 ? 1 : 0;
    return { ...NO_INPUT, mx: (dx / d) * away + (-dy / d) * 0.6, my: (dy / d) * away + (dx / d) * 0.6, shoot: true, dodge: d < 1.2 };
  }
  // vai para uma porta que leva a sala não vista (prefere a do chefe)
  const r = run.d.rooms[run.room];
  const order = [...r.doors].sort((a, b) => {
    const na = neighbor(run.d, run.room, a), nb = neighbor(run.d, run.room, b);
    return (run.seen[na] ? 1 : 0) - (run.seen[nb] ? 1 : 0) || (nb === run.d.boss ? 1 : 0) - (na === run.d.boss ? 1 : 0);
  });
  const s: Side = order[(Math.floor(run.t / 15)) % order.length];
  const [tx, ty] = doorTile(s);
  const gx = tx + 0.5 + (s === 'e' ? 1 : s === 'w' ? -1 : 0), gy = ty + 0.5 + (s === 's' ? 1 : s === 'n' ? -1 : 0);
  const dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy) || 1;
  return { ...NO_INPUT, mx: dx / d, my: dy / d };
}
for (const andar of [1, 10, 30, 60]) {
  let win = 0, hp = 0, time = 0;
  for (let k = 0; k < N; k++) {
    let run = startRun(k * 977 + andar, andar);
    while (!run.result && run.t < 600) run = stepRun(run, bot(run), 0.05);
    if (run.result === 'win') { win++; hp += run.p.hp; }
    time += run.t;
  }
  console.log(`andar ${String(andar).padStart(2)}: vitória ${Math.round((win / N) * 100)}% · vida sobrando ${(hp / Math.max(1, win)).toFixed(1)}/6 · ${Math.round(time / N)} s`);
}
