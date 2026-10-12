/**
 * Luta direta com o chefe de cada rank (5º andar), com o robô de aluno:
 * vitória, duração e de onde veio o dano (arma, carta, aliado, estados).
 *   npx vite-node scripts/masmorra-chefe.ts [rank] [raridade das cartas] [partidas]   (MELHORIAS=1: equipado para o rank)
 */
import { startRun, stepRun, warpTo, type Run } from '../src/game/dungeon';
import { bot, loadout, newMem } from './masmorra-bot';
import type { Rarity } from '../src/lib/tcg/types';

const rank = Number(process.argv[2] ?? 0), tier = process.argv[3] ?? 'common', N = Number(process.argv[4] ?? 8);
let wins = 0, t = 0, hurt = 0;
for (let k = 0; k < N; k++) {
  let run: Run = startRun(loadout(rank, tier as Rarity, k, process.env.MELHORIAS === '1'));
  run = warpTo(run, 5, run.d.end);
  run = warpTo(run, 5, run.d.end);
  const boss = run.enemies[0];
  const mem = newMem(k + 1);
  let dmgCard = 0, dmgOther = 0, broken = 0, phaseT: number[] = [];
  while (!run.result && run.t < 600) {
    const inp = bot(run, 'misto', mem);
    const before = run.enemies.find(e => e.id === boss.id)?.hp ?? 0;
    run = stepRun(run, inp, 0.05);
    if (inp.swap) run = stepRun(run, { ...inp, swap: false, skill: undefined, classe: false }, 0.0001);
    const after = run.enemies.find(e => e.id === boss.id)?.hp ?? 0;
    if (before > after) { if (run.ev.some(e => e.k === 'cast')) dmgCard += before - after; else dmgOther += before - after; }
    for (const e of run.ev) { if (e.k === 'postura' && e.boss) broken++; if (e.k === 'phase') phaseT.push(Math.round(run.bossT)); }
  }
  if (run.result === 'win') wins++;
  t += run.bossT; hurt += run.hurtCount;
  console.log(`${k}: ${run.result ?? 'tempo'} em ${Math.round(run.bossT)}s · ${boss.kind} vida ${boss.max} · fases ${phaseT.join(',')} · postura quebrou ${broken}× · golpes levados ${run.hurtCount} · vida ${run.p.hp}/${run.p.max}`);
}
console.log(`rank ${'EDCBAS'[rank]} (${tier}): venceu ${wins}/${N} · ${Math.round(t / N)}s · golpes ${(hurt / N).toFixed(1)}`);
