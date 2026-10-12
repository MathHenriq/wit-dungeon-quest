/**
 * Simulação dos veículos (plano §3.6 pede antes de entrar no jogo): quanto cada
 * um encurta as viagens e quanto rende a mais em entregas por hora, e em quantas
 * horas de entrega ele "se paga".
 *
 *   npx vite-node scripts/veiculos.ts
 *
 * As distâncias são as de verdade: caminho mais curto entre as portas de cada
 * área e até as saídas para as outras áreas (atravessar o mundo).
 */
import { buildZone, ZONES } from '../src/game/world/world';
import { reachable } from '../src/game/fieldwork';
import { RUN_MS, tripMs, VEHICLES, WALK_MS } from '../src/game/vehicles';
import { deliveryTerms } from '../src/game/deliveries';
import { newProgress } from '../src/game/progress';

function bfs(t: ReturnType<typeof buildZone>, sx: number, sy: number): Map<string, number> {
  const d = new Map([[`${sx},${sy}`, 0]]);
  const q: [number, number][] = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (d.has(k) || t.solid[ny]?.[nx] !== false) continue;
      d.set(k, d.get(`${x},${y}`)! + 1); q.push([nx, ny]);
    }
  }
  return d;
}
let total = 0, n = 0;
for (const z of ZONES) {
  const t = buildZone(z);
  const ok = reachable(t);
  const doors = t.doors.filter(dd => ok.has(`${dd.tx},${dd.ty + 1}`));
  for (const a of doors) {
    const d = bfs(t, a.tx, a.ty + 1);
    for (const b of doors) if (b !== a) { const v = d.get(`${b.tx},${b.ty + 1}`); if (v) { total += v; n++; } }
  }
}
const avg = total / n;
// uma entrega média: ida (média dentro da área + meio mundo quando é em outra área) e volta à Central
const p = newProgress();
const near = deliveryTerms(p, true), far = deliveryTerms(p, false);
const tripTiles = { near: avg * 2, far: avg * 2 + 60 };
console.log(`Distância média entre portas da mesma área: ${avg.toFixed(1)} blocos (${n} pares)\n`);
console.log('veículo            | preço  | ms/bloco | perto | longe | entregas/h | moedas/h | paga-se em');
const base = [{ id: 'a pé (andando)', ms: WALK_MS, price: 0 }, { id: 'a pé (correndo)', ms: RUN_MS, price: 0 }];
const rows = [...base.map(b => ({ name: b.id, price: b.price, ms: (t: number) => t * b.ms })), ...VEHICLES.filter(v => !v.flies).map(v => ({ name: v.name, price: v.price, ms: (t: number) => tripMs(v, t) }))];
const runRate = (() => { const tn = rows[1].ms(tripTiles.near) / 1000 + 20, tf = rows[1].ms(tripTiles.far) / 1000 + 20; const perH = 3600 / ((tn + tf) / 2); return { perH, coins: perH * (near.coins + far.coins) / 2 }; })();
for (const r of rows) {
  const tn = r.ms(tripTiles.near) / 1000 + 20, tf = r.ms(tripTiles.far) / 1000 + 20;   // +20 s parado (pegar, entregar)
  const perH = 3600 / ((tn + tf) / 2), coins = perH * (near.coins + far.coins) / 2;
  const gain = coins - runRate.coins;
  console.log(`${r.name.padEnd(18)} | ${String(r.price).padStart(6)} | ${String(Math.round(r.ms(1))).padStart(8)} | ${tn.toFixed(0).padStart(4)}s | ${tf.toFixed(0).padStart(4)}s | ${perH.toFixed(1).padStart(10)} | ${coins.toFixed(0).padStart(8)} | ${r.price && gain > 0 ? `${(r.price / gain).toFixed(1)} h` : '—'}`);
}
console.log('\n"paga-se em": horas só fazendo entregas até o ganho a mais (contra correr) pagar o veículo, SEM limite.');
console.log(`\nCom o limite (PAID_PER_DAY: 5 entregas pagas por dia), sem veículo isso rende ${Math.round(5 * (near.coins + far.coins) / 2)} moedas/dia`);
console.log('e o veículo não muda quanto se ganha: ele só economiza tempo (conforto e exploração). Por isso o preço é de cosmético.');
for (const r of rows.slice(2)) {
  const save = (rows[1].ms(tripTiles.far) - r.ms(tripTiles.far)) / 1000;
  console.log(`  ${r.name}: ${save.toFixed(1)} s a menos por viagem longa (contra correr).`);
}
