/**
 * Economia com tudo junto: quanto um aluno típico ganha por hora em cada
 * atividade e quanto tempo leva para comprar o que existe para comprar.
 *
 *   npx vite-node scripts/economia.ts
 *
 * Suposições (medidas em scripts/tcg-torre.ts): duelo de mesa de 1,6 min
 * (andar 1) a 2,5 min (andar 20), vitória quase sempre nesses andares com o
 * deck inicial, mais 30 s para andar até a próxima mesa; peixe a
 * cada ~13 s acertando 70%; minijogo ~1 min com nota 0,75; entrega ~3 min.
 * Os minijogos e as entregas têm limite por dia (PLAYS_PER_DAY, PAID_PER_DAY):
 * depois do limite só dão experiência.
 */
import { coinsFor } from '../src/lib/tcg/opponents';
import { rollFish } from '../src/game/fishing';
import { rewardOf } from '../src/game/minigames';
import { ITEMS } from '../src/game/items';
import { PAID_PER_DAY, PLAYS_PER_DAY } from '../src/game/life';
import { PACKS } from '../src/game/packs';
import { PLAYMATS } from '../src/game/playmats';
import { ROOM_REWARDS } from '../src/game/room-rewards';
import { VEHICLES } from '../src/game/vehicles';

const price = new Map(ITEMS.map(i => [i.id, i.price]));
const itemsValue = (items: Record<string, number>) => Object.entries(items).reduce((s, [k, n]) => s + (price.get(k) ?? 0) * n, 0);

// Torre: mesas, primeira vitória (as repetidas rendem 20%); minutos por duelo da simulação
const DUEL_MIN: Record<number, number> = { 1: 1.6, 10: 1.9, 20: 2.5 };
const torre = (andar: number) => (coinsFor(andar, 'mesa') * 60) / (DUEL_MIN[andar] + 0.5);
// pesca
let fish = 0; const N = 20000;
for (let i = 0; i < N; i++) fish += rollFish({ deep: i % 3 === 0, night: i % 5 === 0, boat: i % 6 === 0 }, (i * 0.618034) % 1, 0.5).fish.price;
const pescaH = (fish / N) * (3600 / 13) * 0.7;
// minijogos (nota 0,75, 3 acertos): moedas + itens vendidos pelo preço base
const games = ['forno', 'ritmo', 'pintura', 'rotular', 'circuito', 'pares', 'teste-jogo', 'noticia', 'programar'] as const;
const perGame = games.map(g => { const r = rewardOf(g, 0.75, 0, 3); return { g, v: r.coins + itemsValue(r.items) }; });
const gameAvg = perGame.reduce((s, x) => s + x.v, 0) / perGame.length;
const minijogoH = gameAvg * 60;               // 1 por minuto enquanto houver jogadas pagas
const minijogoDia = gameAvg * PLAYS_PER_DAY * 2; // um aluno costuma jogar 2 tipos por dia
const entregaDia = 17 * PAID_PER_DAY.entrega;

const rows: [string, number, string][] = [
  ['Torre, andar 1 (mesas, 1ª vez)', torre(1), ''],
  ['Torre, andar 10', torre(10), ''],
  ['Torre, andar 20', torre(20), ''],
  ['Pesca', pescaH, ''],
  ['Minijogos (enquanto há jogada paga)', minijogoH, `limite: ${PLAYS_PER_DAY} por jogo por dia (~${Math.round(minijogoDia)}/dia em 2 jogos)`],
  ['Entregas', (17 * 60) / 3, `limite: ${PAID_PER_DAY.entrega} por dia (~${entregaDia}/dia)`],
];
console.log('Moedas por hora\n');
for (const [n, v, note] of rows) console.log(`${n.padEnd(40)} ${String(Math.round(v)).padStart(5)}/h  ${note}`);

// um aluno numa aula de 90 min: 40 min de Torre (andar ~10), 20 de pesca, 2 tipos de minijogo, 5 entregas
const aula = torre(10) * (40 / 60) + pescaH * (20 / 60) + minijogoDia + entregaDia;
console.log(`\nAula típica de 90 min: ~${Math.round(aula)} moedas (2 aulas por semana: ~${Math.round(aula * 2)})\n`);

const goods: [string, number][] = [
  ...PACKS.map(p => [p.name, p.price] as [string, number]),
  ...PLAYMATS.filter(m => m.preco > 0).map(m => [`Tapete ${m.nome}`, m.preco] as [string, number]),
  ...ROOM_REWARDS.map(r => [`Sala: ${r.nome}`, r.preco] as [string, number]),
  ...VEHICLES.map(v => [`Veículo: ${v.name}`, v.price] as [string, number]),
];
console.log('Quanto tempo para comprar (em aulas de 90 min)\n');
for (const [n, v] of goods) console.log(`${n.padEnd(42)} ${String(v).padStart(6)}  ${(v / aula).toFixed(1).padStart(5)} aulas`);
