import { describe, expect, it } from 'vitest';
import { doorTile, DUNGEON_PAID, dungeonCard, finishRun, generate, neighbor, NO_INPUT, reachableIn, RH, roomCount, RW, startRun, stepRun, type Run } from '../dungeon';
import { newProgress } from '../progress';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';

const go = (run: Run, mx: number, my: number, secs: number) => { let r = run; for (let t = 0; t < secs; t += 0.05) r = stepRun(r, { ...NO_INPUT, mx, my }, 0.05); return r; };

describe('masmorra', () => {
  it('mesma semente, mesmo mapa; todas as salas ligadas; chefe na mais longe; toda porta alcançável', () => {
    expect(generate(7, 3)).toEqual(generate(7, 3));
    for (let seed = 1; seed < 60; seed++) {
      const d = generate(seed, seed % 30 + 1);
      expect(d.rooms).toHaveLength(roomCount(d.andar));
      const seen = new Set([0]), q = [0], dist = [0];
      while (q.length) { const c = q.shift()!; for (const s of d.rooms[c].doors) { const n = neighbor(d, c, s); expect(n).toBeGreaterThanOrEqual(0); if (!seen.has(n)) { seen.add(n); dist[n] = dist[c] + 1; q.push(n); } } }
      expect(seen.size).toBe(d.rooms.length);
      expect(dist[d.boss]).toBe(Math.max(...dist));
      expect(d.rooms[d.boss].kind).toBe('chefe');
      for (const r of d.rooms) {
        const ok = reachableIn(r);
        for (const s of r.doors) expect(ok.has(doorTile(s).join(',')), `semente ${seed}`).toBe(true);
        for (const sp of r.spawns) expect(ok.has(`${Math.floor(sp.x)},${Math.floor(sp.y)}`)).toBe(true);
      }
    }
  });
  it('a sala do começo já vem limpa; porta aberta leva para a vizinha e a vizinha tranca até limpar', () => {
    let run = startRun(11, 1);
    expect(run.cleared[run.d.start]).toBe(true);
    const side = run.d.rooms[run.d.start].doors[0];
    const dir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[side];
    run = go(run, dir[0], dir[1], 3);
    expect(run.room).toBe(neighbor(run.d, run.d.start, side));
    expect(run.enemies.length).toBeGreaterThan(0);
    expect(run.cleared[run.room]).toBe(false);
    expect(run.p.x).toBeGreaterThan(0.5); expect(run.p.x).toBeLessThan(RW - 0.5);
    expect(run.p.y).toBeGreaterThan(0.5); expect(run.p.y).toBeLessThan(RH - 0.5);
    // sem inimigos: limpa e abre
    run = stepRun({ ...run, enemies: [] }, NO_INPUT, 0.05);
    expect(run.cleared[run.room]).toBe(true);
  });
  it('tiro acerta, inimigo morre e dá moedas; levar dano tira vida e dá invencível; esquiva não leva dano', () => {
    let run = startRun(3, 1);
    run = { ...run, enemies: [{ id: 99, kind: 'slime', x: 10.5, y: 4.5, hp: 1, max: 3, cd: 9, t: 0, hit: 0 }], cleared: run.cleared.map(() => false) };
    run = stepRun(run, { ...NO_INPUT, shoot: true }, 0.05);   // mira automática no slime
    for (let k = 0; k < 10; k++) run = stepRun(run, NO_INPUT, 0.05);
    expect(run.kills).toBe(1);
    expect(run.coins).toBe(1);
    let hit = startRun(3, 1);
    hit = { ...hit, enemies: [{ id: 1, kind: 'slime', x: hit.p.x, y: hit.p.y, hp: 3, max: 3, cd: 9, t: 0, hit: 0 }], cleared: hit.cleared.map(() => false) };
    const h1 = stepRun(hit, NO_INPUT, 0.05);
    expect(h1.p.hp).toBe(5);
    expect(stepRun(h1, NO_INPUT, 0.05).p.hp).toBe(5);   // invencível por 1 s
    const dodge = stepRun(hit, { ...NO_INPUT, dodge: true, mx: 1 }, 0.05);
    expect(dodge.p.hp).toBe(6);
  });
  it('vencer o chefe termina a masmorra com vitória', () => {
    let run = startRun(5, 2);
    run = { ...run, room: run.d.boss, enemies: [], cleared: run.cleared.map((c, i) => (i === run.d.boss ? false : c)) };
    expect(stepRun(run, NO_INPUT, 0.05).result).toBe('win');
  });
  it('prêmio: carta do deck do chefe e moedas com teto; 3 pagas por dia; perdeu, metade das moedas', () => {
    expect(CARD_BY_ID.has(dungeonCard(4, 123))).toBe(true);
    const win = { ...startRun(1, 4), result: 'win' as const, coins: 200 };
    let p = newProgress();
    const now = Date.UTC(2026, 9, 8, 15);
    const c0 = p.coins;
    for (let k = 0; k < DUNGEON_PAID; k++) {
      const r = finishRun(p, win, now);
      expect(r.paid).toBe(true); expect(r.coins).toBe(60); expect(r.card).toBe(dungeonCard(4, 1));
      p = r.progress;
    }
    expect(p.coins).toBe(c0 + 180);
    expect(finishRun(p, win, now).paid).toBe(false);
    const lose = finishRun(newProgress(), { ...win, result: 'lose', coins: 30 }, now);
    expect(lose.coins).toBe(15); expect(lose.card).toBeUndefined();
  });
});
