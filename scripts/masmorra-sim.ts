/**
 * Simula portais com um robô: foge dos avisos no chão (esquiva no último
 * instante, para tentar a esquiva perfeita), combo de espada de perto (toca o
 * ataque), golpe pesado nos grandes, tiro de longe, cartas quando recarregam
 * (segura as que carregam), habilidade do Caminho, desce a escada e escolhe a
 * 1ª bênção. Mostra vitória, duração, andar médio, golpes levados e nota.
 *   npx vite-node scripts/masmorra-sim.ts [partidas] [ranks, ex.: 0,2,5]
 * ESTILO=espada|tiro|misto · CARTAS=comum|rara|lendaria · DBG=1
 * Ajustar: ENEMY/hpMult em src/game/dungeon-core.ts, chefes em dungeon-boss.ts.
 */
import { chooseBuff, gradeMult, startRun, stepRun } from '../src/game/dungeon';
import { bot, loadout, newMem, type Style } from './masmorra-bot';


const N = Number(process.argv[2] ?? 10);
const RANKS = (process.argv[3] ?? '0,1,2,3,4,5').split(',').map(Number);

const tier = process.env.CARTAS ?? 'rara';
const rarity = tier === 'comum' ? 'common' : tier === 'lendaria' ? 'legendary' : 'rare';
for (const style of (process.env.ESTILO ? [process.env.ESTILO] : ['misto', 'espada']) as Style[]) {
  console.log(`\n── estilo: ${style} · cartas ${tier}`);
  for (const rank of RANKS) {
    let win = 0, time = 0, hurt = 0, floors = 0, timeout = 0, perf = 0, gm = 0, kills = 0, boss = 0, bossT = 0;
    const deaths: Record<string, number> = {};
    for (let k = 0; k < N; k++) {
      let run = startRun(loadout(rank, rarity, k, process.env.MELHORIAS === '1'));
      const mem = newMem(k * 31 + rank + 1);
      while (!run.result && run.t < 2400) {
        if (run.choice) { run = chooseBuff(run, run.choice[0]); continue; }
        const inp = bot(run, style, mem);
        run = stepRun(run, inp, 0.05);
        perf += run.ev.filter(e => e.k === 'perfeita').length;
        if (inp.swap) run = stepRun(run, { ...inp, swap: false, skill: undefined, classe: false }, 0.0001);
      }
      if (run.result === 'win') win++;
      if (run.d.rooms[run.room].kind === 'chefe') { boss++; bossT += run.bossT; }
      if (run.result === 'lose') { const key = `${run.floor}${run.d.rooms[run.room].kind === 'chefe' ? 'C' : run.d.rooms[run.room].kind === 'elite' ? 'M' : ''}`; deaths[key] = (deaths[key] ?? 0) + 1; }
      if (!run.result) timeout++;
      if (!run.result && process.env.DBG) console.log('  travou', k, 'andar', run.floor, 'sala', run.room, run.d.rooms[run.room].kind, 'inimigos', run.enemies.length, run.enemies.map(e => `${e.kind}@${e.x.toFixed(1)},${e.y.toFixed(1)} ${e.state}`).join(' '), 'p', run.p.x.toFixed(1), run.p.y.toFixed(1), 'limpa', run.cleared[run.room]);
      time += run.t; hurt += run.hurtCount; floors += run.floor; gm += gradeMult(run.grades); kills += run.kills;
    }
    console.log(`rank ${'EDCBAS'[rank]}: vitória ${String(Math.round((win / N) * 100)).padStart(3)}% · ${(time / N / 60).toFixed(1)} min · andar ${(floors / N).toFixed(1)} · golpes ${(hurt / N).toFixed(1)} · nota ×${(gm / N).toFixed(2)} · perfeitas ${(perf / N).toFixed(1)} · inimigos ${(kills / N).toFixed(0)} · chefe ${win}/${boss} em ${boss ? Math.round(bossT / boss) : 0}s · morreu ${Object.entries(deaths).sort().map(([k, v]) => `${k}:${v}`).join(' ')} · travou ${timeout}`);
  }
}
