import { describe, expect, it } from 'vitest';
import { fit, PATHS, pathDeck, suggestPath } from '../paths';
import { maxCopies } from '../opponents';
import { checkDeck, choosePath, newProgress, sanitizeProgress } from '@/game/progress';

describe('Caminhos (decks iniciais)', () => {
  it('cada Caminho tem 20 cartas válidas, com a cara do estilo', () => {
    for (const p of PATHS) {
      const d = pathDeck(p.id);
      expect(d).toHaveLength(20);
      const n = new Map<string, number>();
      for (const c of d) n.set(c.id, (n.get(c.id) ?? 0) + 1);
      for (const c of d) expect(n.get(c.id)!).toBeLessThanOrEqual(maxCopies(c));
      expect(d.every(c => ['common', 'uncommon', 'rare'].includes(c.rarity))).toBe(true);
      expect(d.filter(c => c.rarity === 'rare').length).toBeLessThanOrEqual(p.rares ?? 0);
      expect(d.filter(c => c.type === 'attack').length).toBeGreaterThanOrEqual(6);
      expect(d.filter(c => fit(c, p) > 0).length, p.id).toBeGreaterThanOrEqual(8);
    }
  });
  it('escolher o Caminho põe as cartas na coleção e o deck no lugar do inicial; só uma vez', () => {
    const p = choosePath(newProgress(), 'alquimista');
    expect(p.caminho).toBe('alquimista');
    expect(p.decks[0]).toEqual(pathDeck('alquimista').map(c => c.id));
    expect(checkDeck(p.decks[0], p.collection).ok).toBe(true);
    expect(choosePath(p, 'louco')).toBe(p);
    expect(sanitizeProgress(JSON.parse(JSON.stringify(p))).caminho).toBe('alquimista');
    // quem já mexeu no deck 1 ganha o do Caminho num espaço vazio
    const mexido = { ...newProgress(), decks: [newProgress().decks[0].slice(1), [], []] };
    expect(choosePath(mexido, 'sabio').decks[1]).toEqual(pathDeck('sabio').map(c => c.id));
  });
  it('sugere o Caminho pela classe do WIT 1', () => {
    expect(suggestPath('Mago')).toBe('sabio');
    expect(suggestPath('Necromante')).toBe('ceifador');
    expect(suggestPath('Espião')).toBe('trapaceiro');
    expect(suggestPath(null)).toBe('desafiante');
  });
});
