import { describe, expect, it } from 'vitest';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { leader, VOTE_THEMES, votePct, weekCards, weekOf } from '../class-events';

describe('eventos da turma', () => {
  it('temas com id aceito pelo servidor e sem repetir', () => {
    for (const t of VOTE_THEMES) expect(t.id).toMatch(/^[a-z-]{2,24}$/);
    expect(new Set(VOTE_THEMES.map(t => t.id)).size).toBe(VOTE_THEMES.length);
  });
  it('quem lidera e a porcentagem', () => {
    const v = { options: ['a', 'b', 'c'], votos: { a: 2, b: 5, c: 5 }, total: 12 };
    expect(leader(v)).toBe('b');
    expect(leader({ options: ['a'], votos: {} })).toBeNull();
    expect(votePct(v, 'b')).toBe(42);
  });
  it('Carta da Aula: 3 sugestões (Comum, Incomum, Rara), iguais na semana e trocam na seguinte', () => {
    const w = weekOf(new Date(2026, 9, 8));
    expect(weekOf(new Date(2026, 9, 6))).toBe(w);   // terça e quinta da mesma semana
    expect(weekOf(new Date(2026, 9, 13))).toBe(w + 1);
    const c = weekCards(w);
    expect(c.map(id => CARD_BY_ID.get(id)!.rarity)).toEqual(['common', 'uncommon', 'rare']);
    expect(weekCards(w)).toEqual(c);
    expect(weekCards(w + 1)).not.toEqual(c);
  });
});
