import { describe, expect, it } from 'vitest';
import { buildTown, MAP_H, MAP_W } from '../town';
import { advance, findPath, newWalker, tick, TURN_MS, tryStep, type Dir } from '../movement';
import { NPCS } from '../content';
import { recolorBase } from '../recolor';

const town = buildTown();
const blocked = (tx: number, ty: number) =>
  tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H || town.solid[ty][tx] || NPCS.some(n => n.tx === tx && n.ty === ty);

/** Todos os blocos alcançáveis a partir do início. */
function reachable(): Set<string> {
  const seen = new Set<string>([`${town.spawn.tx},${town.spawn.ty}`]);
  const q = [[town.spawn.tx, town.spawn.ty]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

describe('cidade inicial', () => {
  it('tem o tamanho da planta e o chão pintado inteiro', () => {
    expect(town.ground.w).toBe(MAP_W * 16);
    expect(town.ground.h).toBe(MAP_H * 16);
    let transparentes = 0;
    for (let i = 3; i < town.ground.data.length; i += 4) if (town.ground.data[i] !== 255) transparentes++;
    expect(transparentes).toBe(0);
  });

  it('tem todos os prédios do plano, cada um com porta', () => {
    const ids = new Set(town.doors.map(d => d.building));
    for (const id of ['torre', 'centro', 'loja', 'arena', 'guildas', 'sua-casa']) expect(ids.has(id)).toBe(true);
  });

  it('o início é livre e toda porta dá para entrar vindo de baixo', () => {
    expect(blocked(town.spawn.tx, town.spawn.ty)).toBe(false);
    const ok = reachable();
    for (const d of town.doors) {
      expect(town.solid[d.ty][d.tx], `porta de ${d.building} bloqueada`).toBe(false);
      expect(ok.has(`${d.tx},${d.ty + 1}`), `frente da porta de ${d.building} (${d.tx},${d.ty + 1}) inalcançável`).toBe(true);
    }
  });

  it('os moradores ficam em blocos livres, alcançáveis, fora das portas', () => {
    const ok = reachable();
    for (const n of NPCS) {
      expect(town.solid[n.ty][n.tx], `morador ${n.id} dentro de algo`).toBe(false);
      expect(town.doors.some(d => d.tx === n.tx && d.ty === n.ty)).toBe(false);
      const vizinho = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ok.has(`${n.tx + dx},${n.ty + dy}`));
      expect(vizinho, `morador ${n.id} sem ninguém conseguir chegar perto`).toBe(true);
    }
  });

  it('as saídas sul e leste estão abertas', () => {
    const ok = reachable();
    expect(ok.has(`19,${MAP_H - 1}`) || ok.has(`20,${MAP_H - 1}`)).toBe(true);
    expect(ok.has(`${MAP_W - 1},16`) || ok.has(`${MAP_W - 1},17`)).toBe(true);
  });

  it('é determinística: gerar de novo dá o mesmo chão', () => {
    const again = buildTown();
    expect(Buffer.from(again.ground.data).equals(Buffer.from(town.ground.data))).toBe(true);
    expect(again.objects.length).toBe(town.objects.length);
  });
});

describe('movimento em grade', () => {
  it('anda um bloco e termina o passo', () => {
    const w = newWalker(5, 5);
    expect(tryStep(w, 'east', () => false)).toBe(true);
    expect(w.tx).toBe(6);
    expect(advance(w, 100, 200)).toBe(false);
    expect(advance(w, 120, 200)).toBe(true);
    expect(w.from).toBeNull();
  });

  it('só vira quando o caminho está fechado', () => {
    const w = newWalker(5, 5, 'south');
    expect(tryStep(w, 'north', () => true)).toBe(false);
    expect(w.dir).toBe('north');
    expect(w.ty).toBe(5);
  });

  it('acha caminho contornando obstáculo', () => {
    const wall = (x: number, y: number) => x === 3 && y >= 0 && y <= 4;
    const path = findPath(1, 2, 5, 2, (x, y) => wall(x, y) || x < 0 || y < 0 || x > 8 || y > 8);
    expect(path.length).toBeGreaterThan(4);
    let x = 1, y = 2;
    const d: Record<Dir, [number, number]> = { south: [0, 1], north: [0, -1], west: [-1, 0], east: [1, 0] };
    for (const s of path) { x += d[s][0]; y += d[s][1]; expect(wall(x, y)).toBe(false); }
    expect([x, y]).toEqual([5, 2]);
  });

  it('anda vários blocos seguidos sem pausa entre eles', () => {
    const w = newWalker(0, 0, 'east');
    let steps = 0;
    // 10 quadros de 23 ms = 230 ms = 1 bloco a 230 ms/bloco; 46 quadros ≈ 4,6 blocos
    for (let f = 0; f < 46; f++) tick(w, 23, { msPerTile: 230, blocked: () => false, want: () => 'east', onStep: () => steps++ });
    expect(steps).toBe(5);           // começou o 5º passo sem esperar
    expect(w.tx).toBe(5);
    expect(w.anim).toBeGreaterThan(900); // animação contínua, não reiniciou a cada bloco
  });

  it('toque rápido numa direção nova só vira; segurar anda', () => {
    const w = newWalker(3, 3, 'south');
    tick(w, 16, { msPerTile: 230, blocked: () => false, want: () => 'north' });
    expect(w.dir).toBe('north');
    expect(w.from).toBeNull();        // virou sem andar
    tick(w, TURN_MS + 5, { msPerTile: 230, blocked: () => false, want: () => 'north' });
    expect(w.from).not.toBeNull();    // continuou segurando: andou
    expect(w.ty).toBe(2);
  });

  it('ao soltar a tecla, termina o bloco e para com a animação zerada', () => {
    const w = newWalker(0, 0, 'east');
    let want: Dir | null = 'east';
    tick(w, 50, { msPerTile: 230, blocked: () => false, want: () => want });
    want = null;
    for (let f = 0; f < 20; f++) tick(w, 16, { msPerTile: 230, blocked: () => false, want: () => want });
    expect(w.from).toBeNull();
    expect(w.tx).toBe(1);
    expect(w.anim).toBe(0);
  });

  it('na cidade, vai do início até a porta da Loja', () => {
    const loja = town.doors.find(d => d.building === 'loja')!;
    const path = findPath(town.spawn.tx, town.spawn.ty, loja.tx, loja.ty, blocked);
    expect(path.length).toBeGreaterThan(5);
    expect(path[path.length - 1]).toBe('north');
  });
});

describe('troca de cor do boneco', () => {
  it('muda o cabelo castanho sem mexer na transparência', () => {
    const w = 32;
    const data = new Uint8ClampedArray(w * w * 4);
    // um pixel de cabelo castanho no alto e um de pele
    const set = (x: number, y: number, r: number, g: number, b: number) => {
      const i = (y * w + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    };
    set(10, 5, 0x6e, 0x44, 0x28);
    set(12, 12, 0xf6, 0xc7, 0xad);
    const before = new Uint8ClampedArray(data);
    recolorBase(data, w, { hair: 'azul', top: 'branco', bottom: 'cinza' });
    const i = (5 * w + 10) * 4, j = (12 * w + 12) * 4;
    expect([data[i], data[i + 1], data[i + 2]]).not.toEqual([before[i], before[i + 1], before[i + 2]]);
    expect(data[i + 2]).toBeGreaterThan(data[i]); // ficou azulado
    expect([data[j], data[j + 1], data[j + 2]]).toEqual([before[j], before[j + 1], before[j + 2]]); // pele intacta
    for (let k = 3; k < data.length; k += 4) expect(data[k]).toBe(before[k]);
  });
});

describe('cidade com os sprites convertidos do GPT', () => {
  it('usa a mesma planta: portas alcançáveis e todo sprite cabe no seu lugar', async () => {
    const { loadWorldAssetsNode } = await import('../../../../scripts/mapa/assets-node');
    const assets = loadWorldAssetsNode();
    expect(Object.keys(assets).length).toBeGreaterThan(40);
    const t = buildTown(assets);
    expect(t.doors.length).toBe(town.doors.length);
    expect(t.solid).toEqual(town.solid);
    for (const o of t.objects) expect(o.x + o.pix.w, `${o.id} passa da borda`).toBeLessThanOrEqual(t.ground.w + 32);
  }, 20000);
});
