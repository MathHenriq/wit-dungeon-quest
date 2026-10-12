import { describe, expect, it } from 'vitest';
import { earnedTitles, shownTitle, TITLES_LIST } from '../titles';
import { newProgress } from '../progress';

describe('títulos', () => {
  it('começa com Novato; ganha pelos marcos e mostra o escolhido só se ganhou', () => {
    const p = newProgress();
    expect(earnedTitles(p).map(t => t.id)).toEqual(['novato']);
    expect(shownTitle(p)).toBe('Novato');
    const q = { ...p, towerMax: 12, caminho: 'sabio' as const, titulo: 'escalador' };
    expect(earnedTitles(q).map(t => t.id)).toEqual(expect.arrayContaining(['caminho', 'escalador']));
    expect(shownTitle(q)).toBe('Escalador');
    expect(shownTitle({ ...q, titulo: 'lenda-torre' })).toBe('Sábio');
    expect(shownTitle({ ...q, titulo: 'lenda-torre' }, 'Pescador · Aprendiz')).toBe('Pescador · Aprendiz');
    expect(new Set(TITLES_LIST.map(t => t.id)).size).toBe(TITLES_LIST.length);
  });
});
