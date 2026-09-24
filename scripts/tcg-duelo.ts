/**
 * Duelo roteirizado para ver o motor do TCG funcionando, jogada a jogada.
 *
 *   npx vite-node scripts/tcg-duelo.ts
 *
 * Imprime o log da partida com a conta de cada dano. Serve para testar combos
 * novos sem abrir o jogo: monte o roteiro, rode e leia.
 */

import { createGame, endTurn, playCard } from '../src/lib/tcg/engine';
import { describeCard } from '../src/lib/tcg/describe';
import { SAMPLE as C } from '../src/lib/tcg/cards/sample';
import type { CardDef, GameState } from '../src/lib/tcg/types';

const P: CardDef = { id: 'filler', name: 'Pedrinha', type: 'challenger', element: 'Ground', rarity: 'common' };

// Decks na ordem (sem embaralhar): as 5 primeiras são a mão inicial.
let s: GameState = createGame([
  { name: 'Matheus', element: 'Fire', deck: [
    C.vulcao, C.katana, C.pira, P, C.furia,                // mão inicial
    C.brasa, C.guardiao, P, P, C.brasa, P, P,              // compras (o Guardião mói as 2 Pedrinhas)
  ] },
  { name: 'Itachi', element: 'Grass', deck: [
    C.espelho, C.tsukuyomi, C.sombra, C.armadura, C.jato,  // mão inicial
    C.brasa, P, P, P, P, P, P,
  ] },
], { shuffle: false, firstPlayer: 1, seed: 3 });

const uid = (p: 0 | 1, id: string) => {
  const c = s.players[p].hand.find(x => x.def.id === id);
  if (!c) throw new Error(`${id} não está na mão de ${s.players[p].name}`);
  return c.uid;
};
const jogar = (p: 0 | 1, id: string, extra = {}) => { s = playCard(s, uid(p, id), extra); };
const passar = () => { s = endTurn(s); };

// ── Turno 1 · Itachi: baixa a armadilha e equipa a armadura ─────────────────
jogar(1, 'espelho');
jogar(1, 'armadura');
passar();

// ── Turno 2 · Matheus: prepara o combo, mas não ataca (sabe que tem armadilha?) ─
jogar(0, 'vulcao');
jogar(0, 'katana');
jogar(0, 'pira', { discard: [uid(0, 'filler')] }); // custo: descarta a Pedrinha
jogar(0, 'furia');
jogar(0, 'brasa');         // cai no Espelho Negro: anulado, e o ×2 fica guardado
passar();

// ── Turno 3 · Itachi: Tsukuyomi trava os ataques do Matheus ─────────────────
jogar(1, 'tsukuyomi', { discard: [uid(1, 'sombra')] });
jogar(1, 'jato');
passar();

// ── Turno 4 · Matheus: travado. Joga o Guardião e espera ────────────────────
jogar(0, 'guardiao');
passar();

// ── Turno 5 · Itachi ataca com a Brasa, mas o escudo segura ─────────────────
jogar(1, 'brasa');
passar();

// ── Turno 6 · Matheus solta o combo guardado ────────────────────────────────
jogar(0, 'brasa');

// ── Saída ───────────────────────────────────────────────────────────────────
for (const e of s.log) {
  if (e.text.startsWith('—')) { console.log(`\n${e.text}`); continue; }
  console.log(`  ${e.text}`);
}
console.log(`\nVida final — ${s.players[0].name}: ${s.players[0].life} · ${s.players[1].name}: ${s.players[1].life}`);

console.log('\n── Texto gerado para as cartas usadas ──');
for (const c of [C.furia, C.pira, C.tsukuyomi, C.guardiao, C.espelho, C.katana, C.armadura, C.vulcao]) {
  const d = describeCard(c);
  console.log(`\n${c.name} [${c.rarity}]${d.cost ? `\n  Custo: ${d.cost}` : ''}\n  ${d.text}`);
}
