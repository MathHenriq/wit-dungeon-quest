// Sprites dos golpes de carta na masmorra (src/components/dungeon/card-sprites.ts):
// toda folha da tabela existe, todo empréstimo aponta para uma folha da tabela e
// toda carta de Ataque com kit acha o que desenhar.
import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { KITS } from '@/game/dungeon-kits';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { pick, PROXY, SHEET } from '@/components/dungeon/card-sprites';

describe('sprites das cartas da masmorra', () => {
  it('as 67 folhas do GPT estão na tabela, e só elas', () => {
    const files = readdirSync('public/game/efeitos').filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)).sort();
    expect(Object.keys(SHEET).sort()).toEqual(files);
  });

  it('quadros dentro da folha (6) e em ordem', () => {
    for (const [id, s] of Object.entries(SHEET)) {
      for (const [a, b] of [s.voo, s.fim]) { expect(a, id).toBeGreaterThanOrEqual(0); expect(b, id).toBeLessThanOrEqual(5); expect(a, id).toBeLessThanOrEqual(b); }
      if (s.feixe !== undefined) expect(s.feixe, id).toBeLessThanOrEqual(5);
    }
  });

  it('todo empréstimo aponta para uma folha da tabela', () => {
    for (const [el, uses] of Object.entries(PROXY)) for (const id of Object.values(uses)) expect(SHEET[id!], `${el} → ${id}`).toBeTruthy();
    for (const id of Object.keys(SHEET)) expect(existsSync(`public/game/efeitos/${id}.png`), id).toBe(true);
  });

  it('toda carta de Ataque com kit tem impacto (folha própria ou do elemento)', () => {
    for (const k of KITS) {
      const c = CARD_BY_ID.get(k.card);
      expect(c, k.card).toBeTruthy();
      expect(pick(k.card, c!.element, 'impacto'), k.card).not.toBeNull();
    }
  });

  it('Épica+ usa a própria folha; Comum–Rara usa a do elemento, menor', () => {
    expect(pick('kamehameha', 'Water', 'feixe')).toMatchObject({ id: 'kamehameha', own: true, scale: 1 });
    const p = pick('bola-de-fogo', 'Fire', 'impacto')!;
    expect(p.own).toBe(false);
    expect(p.scale).toBeLessThan(1);
    // a folha do tigre não vira chão: o rastro usa a zona do elemento
    expect(pick('nona-forma-rengoku', 'Fire', 'zona')!.id).toBe(PROXY.Fire.zona);
  });
});
