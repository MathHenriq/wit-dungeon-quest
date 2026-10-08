// Evolução de cartas (decisão: "fica para depois do básico"; feita em 08/10):
// 3 cópias + pó viram a versão "+" da carta, com 10% mais força. A força muda
// NO EFEITO (dano, cura, bônus, redução), nunca no texto: o texto continua
// saindo de describeCard. Carta sem número para crescer (só compra, trava...)
// não evolui. A versão "+" tem id `<id>+` e a mesma raridade.
import type { Amount, CardDef, Effect, Passive } from './types';

export const EVOLVE_SUFFIX = '+';
export const EVOLVE_MULT = 1.1;
export const isEvolved = (id: string) => id.endsWith(EVOLVE_SUFFIX);
export const baseIdOf = (id: string) => (isEvolved(id) ? id.slice(0, -EVOLVE_SUFFIX.length) : id);

const up = (n: number) => (n > 0 ? Math.max(n + 1, Math.ceil(n * EVOLVE_MULT)) : n);
const upAmount = (a: Amount): Amount => (typeof a === 'number' ? up(a) : a);

function upEffect(e: Effect): Effect {
  switch (e.kind) {
    case 'damage': case 'heal': return { ...e, amount: upAmount(e.amount) };
    case 'bonus': return { ...e, ...(typeof e.add === 'number' ? { add: up(e.add) } : {}) };
    case 'conditional': return { ...e, then: e.then.map(upEffect), ...(e.else ? { else: e.else.map(upEffect) } : {}) };
    case 'aura': return { ...e, effects: e.effects.map(upEffect) };
    default: return e;
  }
}
function upPassive(p: Passive): Passive {
  switch (p.kind) {
    case 'attackBonus': return { ...p, ...(typeof p.add === 'number' ? { add: up(p.add) } : {}) };
    case 'damageReduction': return { ...p, amount: up(p.amount) };
    case 'onTurnStart': return { ...p, effects: p.effects.map(upEffect) };
    default: return p;
  }
}

/** A versão "+" (ou null se a carta não tem número para crescer). */
export function evolveCard(c: CardDef): CardDef | null {
  if (isEvolved(c.id)) return null;
  const next: CardDef = {
    ...c, id: c.id + EVOLVE_SUFFIX, name: `${c.name} +`,
    ...(typeof c.damage === 'number' ? { damage: up(c.damage) } : {}),
    ...(c.effects ? { effects: c.effects.map(upEffect) } : {}),
    ...(c.passives ? { passives: c.passives.map(upPassive) } : {}),
  };
  const same = JSON.stringify({ ...next, id: c.id, name: c.name }) === JSON.stringify(c);
  return same ? null : next;
}
