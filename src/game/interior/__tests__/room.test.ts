import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findPath } from '@/game/world/movement';
import {
  canPlace, catalogOf, residentRoom, ROOMS, footprint, HOUSE_CATS, HOUSE_START, houseRoom, nextFacing, sanitizeHouse, solidGrid,
  hiddenBehind, seatLine, spriteOf, tableBelow, towerRoom, wanderTiles, type Manifest,
} from '../room';

const m: Manifest = JSON.parse(readFileSync(resolve(__dirname, '../../../../public/game/interior/manifest.json'), 'utf8'));

describe('interiores', () => {
  it('quem passeia começa à vista e tem vários lugares para onde ir sem sumir atrás dos móveis', () => {
    for (const r of Object.values(ROOMS).map(f => f())) {
      for (const n of r.npcs.filter(x => x.wander)) {
        expect(hiddenBehind(m, r, n.tx, n.ty), `${r.id}: ${n.id} começa escondido`).toBeLessThanOrEqual(0.3);
        expect(wanderTiles(m, r, n).length, `${r.id}: ${n.id}`).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it('quem senta numa mesa (desafiante ou jogador) tem a linha do tampo medida', () => {
    const rooms = [...Object.values(ROOMS).map(f => f()), ...[1, 2, 3, 4, 5, 6, 31, 45, 71, 90].map(towerRoom)];
    for (const r of rooms) {
      const seats: [number, number, string][] = [
        ...r.npcs.filter(n => n.seated).map(n => [n.tx, n.ty, n.id] as [number, number, string]),
        ...(r.talks ?? []).filter(t => t.action === 'sentar' && t.seat).map(t => [t.seat![0], t.seat![1], 'livre'] as [number, number, string]),
      ];
      for (const [tx, ty, who] of seats) {
        const q = tableBelow(m, r, tx, ty);
        // atrás de balcão (café, recepção) fica de pé: não precisa da linha
        if (!q || /balcao|recepcao/.test(q.id)) continue;
        expect(seatLine(m, r, tx, ty), `${r.id}: ${who} na ${q.id}`).not.toBeNull();
      }
    }
  });

  it('todo item usado nas salas existe no manifest', () => {
    const rooms = [houseRoom(), towerRoom(1), towerRoom(45), towerRoom(100)];
    for (const r of rooms) {
      expect(m[r.piso], r.piso).toBeTruthy();
      expect(m[r.parede], r.parede).toBeTruthy();
      for (const p of r.items) expect(m[p.id], `${r.id}: ${p.id}`).toBeTruthy();
    }
  });

  it('na Torre dá para chegar em cada mesa, no chefe e na escada a partir da porta', () => {
    for (const andar of [1, 30, 31, 70, 71, 100]) {
      const r = towerRoom(andar);
      const solid = solidGrid(m, r);
      const blocked = (x: number, y: number) => y < 0 || x < 0 || y >= r.h || x >= r.w || solid[y][x];
      for (const n of r.npcs) {
        // algum bloco livre colado num dos blocos de conversa
        const ok = n.talk.some(([tx, ty]) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => {
          const x = tx + dx, y = ty + dy;
          if (blocked(x, y)) return false;
          return (x === r.spawn.tx && y === r.spawn.ty) || findPath(r.spawn.tx, r.spawn.ty, x, y, blocked).length > 0;
        }));
        expect(ok, `andar ${andar}: ${n.id}`).toBe(true);
      }
      const up = r.exits.find(e => e.to === 'subir')!;
      expect(findPath(r.spawn.tx, r.spawn.ty, up.tx, up.ty + 1, blocked).length).toBeGreaterThan(0);
    }
  });

  it('móveis da Torre não se sobrepõem', () => {
    for (const andar of [1, 50, 90]) {
      const r = towerRoom(andar);
      const floor = r.items.filter(p => (m[p.id].camada ?? 'm') === 'm');
      floor.forEach((p, i) => {
        const others = { ...r, items: floor.filter((_, j) => j !== i), npcs: [], exits: [] };
        expect(canPlace(m, others, p), `andar ${andar}: ${p.id}`).toBe(true);
      });
    }
  });

  it('a casa inicial é válida e a porta fica livre', () => {
    const r = houseRoom();
    expect(sanitizeHouse(m, HOUSE_START)).toHaveLength(HOUSE_START.length);
    const solid = solidGrid(m, r);
    for (const e of r.exits) expect(solid[e.ty][e.tx]).toBe(false);
  });

  it('girar troca a vista e a pegada', () => {
    const p = { id: 'sofa-moderno', tx: 3, ty: 5 };
    expect(footprint(m, p)).toEqual([3, 1]);
    const lado = { ...p, facing: nextFacing(m, p) };
    expect(lado.facing).toBe('direita');
    expect(footprint(m, lado)).toEqual([1, 3]);
    expect(spriteOf(m, lado)).toEqual({ id: 'sofa-moderno.lado', flip: false });
    const esq = { ...lado, facing: nextFacing(m, lado) };
    expect(spriteOf(m, esq)).toEqual({ id: 'sofa-moderno.lado', flip: true });
    expect(nextFacing(m, esq)).toBe('frente');
    // sem vista de lado: só espelha
    expect(nextFacing(m, { id: 'guarda-roupa', tx: 0, ty: 0 })).toBe('espelho');
  });

  it('não deixa pôr móvel em cima de outro, na parede ou na porta', () => {
    const r = houseRoom();
    expect(canPlace(m, r, { id: 'cacto', tx: 5, ty: 8 })).toBe(false);     // em cima do sofá
    expect(canPlace(m, r, { id: 'cacto', tx: 3, ty: 1 })).toBe(false);     // na parede
    expect(canPlace(m, r, { id: 'cacto', tx: 6, ty: 9 })).toBe(false);     // na frente da porta
    expect(canPlace(m, r, { id: 'cacto', tx: 11, ty: 9 })).toBe(true);
    expect(canPlace(m, r, { id: 'janela-redonda', tx: 12, ty: 2 })).toBe(true);
    expect(canPlace(m, r, { id: 'janela-redonda', tx: 3, ty: 2 })).toBe(false); // outra janela ali
  });

  it('toda categoria da casa tem itens com nome', () => {
    for (const c of HOUSE_CATS) {
      const ids = catalogOf(m, c.id);
      expect(ids.length, c.id).toBeGreaterThan(3);
      for (const id of ids) expect(m[id].nome, id).toBeTruthy();
    }
  });

  it('casa salva estragada não quebra', () => {
    expect(sanitizeHouse(m, 'x')).toBeNull();
    expect(sanitizeHouse(m, [{ id: 'nao-existe', tx: 1, ty: 4 }, { id: 'cacto', tx: 'a', ty: 5 }, null])).toEqual([]);
  });

  describe.each(Object.keys(ROOMS))('sala %s', id => {
    const r = ROOMS[id]();
    const solid = solidGrid(m, r);
    const blocked = (x: number, y: number) => y < 0 || x < 0 || y >= r.h || x >= r.w || solid[y][x];
    const reach = (x: number, y: number) => !blocked(x, y) && ((x === r.spawn.tx && y === r.spawn.ty) || findPath(r.spawn.tx, r.spawn.ty, x, y, blocked).length > 0);
    const nextTo = (tiles: [number, number][]) => tiles.some(([tx, ty]) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => reach(tx + dx, ty + dy)));

    it('usa só sprites que existem', () => {
      for (const k of [r.piso, r.parede, ...r.items.map(p => p.id), ...(r.patches ?? []).map(p => p.piso)]) expect(m[k], k).toBeTruthy();
    });
    it('móveis não se sobrepõem e ficam dentro da sala', () => {
      const floor = r.items.filter(p => (m[p.id].camada ?? 'm') !== 't');
      floor.forEach((p, i) => {
        const others = { ...r, items: floor.filter((_, j) => j !== i), npcs: [], exits: [] };
        expect(canPlace(m, others, p), `${p.id} em ${p.tx},${p.ty}`).toBe(true);
      });
    });
    it('dá para chegar em todo mundo, em todo ponto de conversa e em toda saída', () => {
      expect(solid[r.spawn.ty][r.spawn.tx]).toBe(false);
      for (const n of r.npcs) expect(nextTo(n.talk), `npc ${n.id}`).toBe(true);
      for (const t of r.talks ?? []) expect(nextTo(t.tiles), `conversa ${t.lines[0]}`).toBe(true);
      for (const e of r.exits) {
        const ok = solid[e.ty][e.tx] ? nextTo([[e.tx, e.ty]]) : reach(e.tx, e.ty);
        expect(ok, `saída ${e.to} ${e.tx},${e.ty}`).toBe(true);
      }
      for (const [from, pos] of Object.entries(r.entries ?? {})) expect(reach(pos.tx, pos.ty), `entrada de ${from}`).toBe(true);
    });
  });
});

describe('casas dos moradores', () => {
  const ids = ['casa-nando', 'casa-lucia', 'casa-marinho', 'casa-coworking', 'npc-pescador', 'npc-musico', 'npc-fazendeiro', 'npc-artista', 'modelo-gamer', 'casa-x1', 'casa-x2', 'casa-x3'];
  it('cada casa tem móveis que existem, sem sobrepor, e dá para chegar em todo canto livre a partir da porta', () => {
    for (const id of ids) {
      const r = residentRoom(m, id, id);
      expect(r.items.length, id).toBeGreaterThanOrEqual(6);
      for (const p of r.items) expect(m[p.id], `${id}: ${p.id}`).toBeTruthy();
      r.items.forEach((p, i) => expect(canPlace(m, r, p, i), `${id}: ${p.id} sobreposto`).toBe(true));
      const solid = solidGrid(m, r);
      for (let y = r.wallRows; y < r.h - 1; y++) for (let x = 0; x < r.w; x++) {
        if (solid[y][x] || (x === r.spawn.tx && y === r.spawn.ty)) continue;
        expect(findPath(r.spawn.tx, r.spawn.ty, x, y, (a, b) => b < 0 || a < 0 || b >= r.h || a >= r.w || solid[b][a]).length, `${id}: (${x},${y}) preso`).toBeGreaterThan(0);
      }
    }
  });
  it('a mesma casa sai sempre igual; casas diferentes, diferentes', () => {
    expect(residentRoom(m, 'casa-nando', 'a')).toEqual(residentRoom(m, 'casa-nando', 'a'));
    expect(JSON.stringify(residentRoom(m, 'casa-nando', 'a').items)).not.toEqual(JSON.stringify(residentRoom(m, 'casa-lucia', 'a').items));
  });
});
