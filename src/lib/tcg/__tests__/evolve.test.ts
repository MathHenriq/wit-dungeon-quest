import { describe, expect, it } from 'vitest';
import { CATALOG, CARD_BY_ID, EVOLVED } from '../cards/catalog';
import { evolveCard } from '../evolve';
import { describeCard } from '../describe';
import { canEvolve, evolve, evolveCost } from '@/game/forge';
import { newProgress } from '@/game/progress';

describe('evolução de cartas (versão +)', () => {
  it('a + de um ataque bate mais; o texto sai do efeito (não escrito à mão)', () => {
    const atk = CATALOG.find(c => c.type === 'attack' && typeof c.damage === 'number' && c.damage >= 10)!;
    const plus = CARD_BY_ID.get(atk.id + '+')!;
    expect(plus.damage).toBeGreaterThan(atk.damage!);
    expect(plus.name).toBe(`${atk.name} +`);
    expect(plus.rarity).toBe(atk.rarity);
    expect(() => describeCard(plus)).not.toThrow();
  });
  it('carta sem número para crescer não evolui; + não evolui de novo', () => {
    for (const c of CATALOG) if (!CARD_BY_ID.has(c.id + '+')) expect(evolveCard(c)).toBeNull();
    expect(evolveCard(EVOLVED[0])).toBeNull();
    expect(CATALOG.length).toBe(350);
  });
  it('evoluir: 3 cópias (2 vão) + pó', () => {
    const c = EVOLVED[0], base = CARD_BY_ID.get(c.id.slice(0, -1))!;
    let p = { ...newProgress(), collection: { [base.id]: 2 }, po: { [base.rarity]: 999 } };
    expect(canEvolve(p, base.id)).toMatch(/3 cópias/);
    p = { ...p, collection: { [base.id]: 3 } };
    const r = evolve(p, base.id);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.progress.collection[base.id]).toBe(1);
      expect(r.progress.collection[c.id]).toBe(1);
      expect(r.progress.po[base.rarity]).toBe(999 - evolveCost(base.rarity));
    }
  });
});
