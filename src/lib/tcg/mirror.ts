// Espelho da partida: o mesmo estado visto do outro lado (o jogador 1 vira o
// 0). O motor não trata nenhum índice de jeito especial, então jogar no estado
// espelhado dá o espelho do resultado: é isso que deixa o PvP online mandar só
// as jogadas (cada aparelho roda o motor, sempre com "eu" no lugar 0).
import type { GameState, LogEntry } from './types';

const flip = <T extends 0 | 1 | null>(v: T): T => (v === null ? v : ((1 - v) as T));

function flipLog(e: LogEntry): LogEntry {
  const out: LogEntry = { ...e, player: flip(e.player) };
  if (e.calc) out.calc = { ...e.calc, target: flip(e.calc.target) };
  if (e.trap) out.trap = { ...e.trap, owner: flip(e.trap.owner) };
  return out;
}

export function mirrorState(s: GameState): GameState {
  return {
    ...s,
    players: [s.players[1], s.players[0]],
    active: flip(s.active),
    firstPlayer: flip(s.firstPlayer),
    winner: flip(s.winner),
    field: s.field ? { ...s.field, owner: flip(s.field.owner) } : null,
    log: s.log.map(flipLog),
  };
}
