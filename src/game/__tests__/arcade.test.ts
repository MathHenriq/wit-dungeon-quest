import { describe, expect, it } from 'vitest';
import { checkLevel, emptyLevel, setTile, startPlay, step, totalCoins } from '../arcade';

describe('fases do fliperama', () => {
  it('a fase vazia já vale e tem caminho', () => {
    expect(checkLevel(emptyLevel())).toBeNull();
  });
  it('início e saída são únicos; parede fechando o caminho invalida', () => {
    let l = setTile(emptyLevel(), 3, 3, 's');
    expect(l.t.split('s').length).toBe(2);
    for (let y = 1; y < l.h - 1; y++) l = setTile(l, 6, y, '#');
    expect(checkLevel(l)).toMatch(/caminho/);
  });
  it('jogar: moeda conta 1 vez, espinho volta ao começo, saída vence', () => {
    let l = setTile(emptyLevel(), 2, 1, 'o');
    l = setTile(l, 1, 2, 'x');
    expect(totalCoins(l)).toBe(1);
    let p = startPlay(l);
    p = step(l, p, 1, 0);
    expect(p.coins).toBe(1);
    p = step(l, p, -1, 0); p = step(l, p, 1, 0);
    expect(p.coins).toBe(1);
    p = step(l, startPlay(l), 0, 1);
    expect(p.deaths).toBe(1);
    let w = startPlay(emptyLevel(6, 5));
    const le = emptyLevel(6, 5);
    for (const [dx, dy] of [[1, 0], [1, 0], [1, 0], [0, 1], [0, 1]]) w = step(le, w, dx, dy);
    expect(w.won).toBe(true);
  });
});
