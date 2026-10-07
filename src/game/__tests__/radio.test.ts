import { describe, expect, it } from 'vitest';
import { playlist, RADIO_SONGS } from '../radio';
import { emptySong } from '../music';

describe('Rádio WIT', () => {
  it('sem músicas de alunos toca só as vinhetas; com músicas, intercala', () => {
    expect(playlist([]).map(s => s.id)).toEqual(RADIO_SONGS.map(s => s.id));
    const mine = [1, 2, 3, 4].map(i => ({ ...emptySong(), id: `m${i}`, nome: `M${i}` }));
    const ids = playlist(mine).map(s => s.id);
    expect(ids.slice(0, 4)).toEqual(['radio-manha', 'm1', 'radio-praca', 'm2']);
    expect(ids).toContain('m4');
    expect(ids).toHaveLength(7);
  });
  it('as vinhetas usam só notas e batidas que existem', () => {
    for (const s of RADIO_SONGS) {
      expect(s.notas).toHaveLength(16);
      for (const t of s.notas) for (const r of t) expect(r).toBeLessThan(8);
      for (const t of s.bateria) for (const d of t) expect(d).toBeLessThan(4);
    }
  });
});
