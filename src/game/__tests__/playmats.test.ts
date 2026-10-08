import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { DEFAULT_MAT, PLAYMATS } from '../playmats';

describe('tapetes', () => {
  it('ids únicos, Clássico grátis e o resto com preço', () => {
    expect(new Set(PLAYMATS.map(m => m.id)).size).toBe(PLAYMATS.length);
    expect(PLAYMATS.find(m => m.id === DEFAULT_MAT)?.preco).toBe(0);
    for (const m of PLAYMATS.filter(x => x.id !== DEFAULT_MAT)) expect(m.preco, m.id).toBeGreaterThan(0);
  });
  it('tapete de imagem à venda tem a arte no repositório; o de código tem fundo', () => {
    for (const m of PLAYMATS) {
      if (m.arte && !m.emBreve) expect(existsSync(`public/game/tapetes/${m.id}.webp`), m.id).toBe(true);
      if (!m.arte) expect(m.fundo, m.id).toBeTruthy();
    }
  });
  it('animados: pelo menos 5, cada um com cor e um dos 4 tipos', () => {
    const a = PLAYMATS.filter(m => m.anim);
    expect(a.length).toBeGreaterThanOrEqual(5);
    for (const m of a) { expect(['brilho', 'faiscas', 'ondas', 'estrelas']).toContain(m.anim); expect(m.animCor, m.id).toMatch(/^#[0-9a-f]{6}$/); }
  });
});
