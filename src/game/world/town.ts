// Planta da cidade inicial: terrenos, prédios, objetos, colisão e portas.
// Tudo em coordenadas de bloco (16 px). A arte sai de ground/props/buildings.
import { TILE, type Building } from './buildings';
import { circuitPixels, paintCircuits, paintGround, type Circuit, type Terrain } from './ground';
import { applyTimeOfDay, lightHalo, timeOfDay } from './light';
import { hash, hex, Pixmap } from './pixmap';
import { LED, PAVE } from './palette';
import * as P from './props';
import * as T from './props-tech';
import { houseHG } from './house-hg';
import { arenaHG, towerHG } from './buildings-hg';
import { cardWorkshop, guildCastle, packShop } from './landmarks';

export const MAP_W = 40;
export const MAP_H = 30;

export interface Placed {
  id: string;
  pix: Pixmap;
  /** Canto superior esquerdo da arte, em pixels. */
  x: number;
  y: number;
  /** Linha do chão (px) usada para ordenar quem fica na frente. */
  baseY: number;
  /** Quadros de animação (opcional). `pix` é o primeiro. */
  frames?: Pixmap[];
  frameMs?: number;
  /** O que acende à noite (mesmo tamanho de `pix`). */
  night?: Pixmap;
  nightFrames?: Pixmap[];
}

export interface Door {
  tx: number;
  ty: number;
  building: string;
  name: string;
}

export interface Town {
  ground: Pixmap;
  objects: Placed[];
  /** true = bloqueado. */
  solid: boolean[][];
  doors: Door[];
  spawn: { tx: number; ty: number };
  terrain: Terrain[][];
  /** Luzes fixas da cidade (chão + objetos sem animação), já com a oclusão. */
  lights: Pixmap;
  /** Pixels de cada circuito da calçada, da Torre para fora (pulsos à noite). */
  circuits: [number, number][][];
  /** Poças de luz no chão (postes), somadas à noite. */
  glowSpots: GlowSpot[];
}

export interface GlowSpot { x: number; y: number; r: number; color: readonly [number, number, number]; k: number }

export function buildTown(): Town {
  const terrain: Terrain[][] = Array.from({ length: MAP_H }, () => Array<Terrain>(MAP_W).fill('grama'));
  const solid: boolean[][] = Array.from({ length: MAP_H }, () => Array<boolean>(MAP_W).fill(false));
  const objects: Placed[] = [];
  const doors: Door[] = [];

  const fill = (t: Terrain, x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (y >= 0 && x >= 0 && y < MAP_H && x < MAP_W) terrain[y][x] = t;
    }
  };
  const block = (x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (y >= 0 && x >= 0 && y < MAP_H && x < MAP_W) solid[y][x] = true;
    }
  };
  /** Objeto cuja base ocupa (tx..tx+tw-1, ty..ty+th-1); a arte encosta embaixo. */
  const put = (id: string, pix: Pixmap | Pixmap[], tx: number, ty: number, tw: number, th: number, isSolid = true, frameMs = 500) => {
    const frames = Array.isArray(pix) ? pix : undefined;
    const first = frames ? frames[0] : (pix as Pixmap);
    const x = tx * TILE + ((tw * TILE - first.w) >> 1);
    const y = (ty + th) * TILE - first.h;
    objects.push({ id, pix: first, x, y, baseY: (ty + th) * TILE, frames, frameMs: frames ? frameMs : undefined });
    if (isSolid) block(tx, ty, tw, th);
  };
  /** Objeto com camada de noite (um ou vários quadros). */
  const putLit = (id: string, lit: T.Lit | T.Lit[], tx: number, ty: number, tw: number, th: number, isSolid = true, frameMs = 500) => {
    const list = Array.isArray(lit) ? lit : [lit];
    put(id, list.length > 1 ? list.map(l => l.pix) : list[0].pix, tx, ty, tw, th, isSolid, frameMs);
    const o = objects[objects.length - 1];
    if (list.length > 1) { o.nightFrames = list.map(l => l.night ?? new Pixmap(l.pix.w, l.pix.h)); o.night = o.nightFrames[0]; }
    else o.night = list[0].night;
  };
  const buildingGlow: GlowSpot[] = [];
  const building = (b: Building, tx: number, ty: number) => {
    for (const gl of b.glow ?? []) buildingGlow.push({ ...gl, x: tx * TILE + gl.x, y: ty * TILE - b.extraTop + gl.y });
    objects.push({
      id: b.id, pix: b.pix, x: tx * TILE, y: ty * TILE - b.extraTop, baseY: (ty + b.tilesH) * TILE,
      frames: b.frames, frameMs: b.frames ? 450 : undefined, night: b.night, nightFrames: b.nightFrames,
    });
    block(tx, ty, b.tilesW, b.tilesH);
    for (const c of b.doorCols) {
      const d = { tx: tx + c, ty: ty + b.tilesH - 1, building: b.id, name: b.name };
      solid[d.ty][d.tx] = false;
      doors.push(d);
    }
  };

  // ── ruas e praça ──
  fill('calcada', 13, 11, 14, 8);          // praça da Torre
  fill('calcada', 1, 16, 12, 2);           // avenida oeste
  fill('calcada', 27, 16, 13, 2);          // avenida leste (saída)
  fill('calcada', 19, 19, 2, 11);          // avenida sul (saída)
  fill('trilha', 2, 8, 15, 2);             // rua norte (oeste)
  fill('trilha', 23, 8, 15, 2);            // rua norte (leste)
  fill('trilha', 15, 8, 2, 3);             // ligação com a praça
  fill('trilha', 23, 8, 2, 3);
  fill('trilha', 4, 7, 1, 1);              // porta da sua casa
  fill('trilha', 10, 7, 1, 1);
  fill('trilha', 28, 7, 1, 1);
  fill('trilha', 34, 7, 1, 1);
  fill('calcada', 6, 15, 3, 1);            // Centro de Cartas → avenida
  fill('calcada', 32, 15, 3, 1);           // Loja → avenida
  fill('trilha', 4, 26, 32, 2);            // rua sul
  fill('trilha', 11, 18, 2, 8);            // ligação avenida oeste → rua sul
  fill('agua', 31, 18, 7, 2);              // lago
  fill('mato', 2, 27, 2, 1);
  fill('mato', 36, 26, 2, 2);
  fill('mato', 22, 28, 2, 1);

  // chão de mata na borda (entre as árvores)
  fill('floresta', 0, 0, MAP_W, 2); fill('floresta', 0, MAP_H - 2, 18, 2); fill('floresta', 22, MAP_H - 2, 18, 2);
  fill('floresta', 0, 0, 2, MAP_H); fill('floresta', MAP_W - 2, 0, 2, 16); fill('floresta', MAP_W - 2, 18, 2, 12);

  // ── prédios ──
  building(towerHG(), 17, 4);
  block(17, 2, 6, 2); // a arte da Torre sobe até aqui: ninguém anda por trás dela
  building(cardWorkshop(), 4, 10);
  building(packShop(), 30, 10);
  building(arenaHG(), 27, 21);
  building(guildCastle(), 4, 21);
  building(houseHG('sua-casa', 'Sua Casa', { roof: 'vermelho', wood: 'bege', led: 'green', tech: 'antena' }), 3, 2);
  building(houseHG('casa-azul', 'Casa', { roof: 'azul', wood: 'branco', door: '#4a78c8', led: 'cyan', tech: 'solar' }), 9, 2);
  building(houseHG('casa-rosa', 'Casa', { roof: 'roxo', wood: 'rosa', tilesW: 6, door: '#b0608a', led: 'pink' }), 26, 2);
  building(houseHG('casa-verde', 'Casa', { roof: 'verde', wood: 'bege', door: '#5a9a4a', led: 'warm', tech: 'solar' }), 33, 2);
  building(houseHG('casa-roxa', 'Casa', { roof: 'roxo', wood: 'branco', door: '#7e60c0', led: 'purple', tech: 'antena' }), 14, 21);
  building(houseHG('casa-laranja', 'Casa', { roof: 'laranja', wood: 'bege', door: '#d07040', led: 'orange', tech: 'solar' }), 21, 21);

  // ── borda de árvores (com saídas ao sul e a leste) ──
  const treeAt = (kind: P.TreeKind, tx: number, ty: number, seed: number) => put(`arvore-${tx}-${ty}`, P.tree(kind, seed), tx, ty, 2, 2);
  // duas fileiras desencontradas: a de trás só aparece entre as da frente
  const behind = (tx: number, ty: number, seed: number) => {
    const pix = P.tree('pinheiro', seed);
    objects.push({ id: `mata-${tx}-${ty}`, pix, x: tx * TILE, y: (ty + 2) * TILE - pix.h, baseY: (ty + 2) * TILE - 1000 });
  };
  for (let tx = -1; tx < MAP_W; tx += 2) behind(tx, -1, tx + 40);
  for (let tx = -1; tx < MAP_W; tx += 2) if (tx < 17 || tx > 21) behind(tx, MAP_H - 1, tx + 60);
  for (let ty = 1; ty < MAP_H; ty += 2) { behind(-1, ty, ty + 80); if (ty < 15 || ty > 17) behind(MAP_W - 1, ty, ty + 90); }
  for (let tx = 0; tx < MAP_W; tx += 2) {
    treeAt('pinheiro', tx, 0, tx);
    if (tx !== 18 && tx !== 20) treeAt('pinheiro', tx, MAP_H - 2, tx + 1);
  }
  for (let ty = 2; ty < MAP_H - 2; ty += 2) {
    treeAt('pinheiro', 0, ty, ty + 3);
    if (ty !== 16) treeAt('pinheiro', MAP_W - 2, ty, ty + 5);
  }
  block(0, 0, MAP_W, 2); block(0, MAP_H - 2, 18, 2); block(22, MAP_H - 2, 18, 2);
  block(0, 0, 2, MAP_H); block(MAP_W - 2, 0, 2, 16); block(MAP_W - 2, 18, 2, 12);
  // árvores soltas pela cidade
  treeAt('redonda', 14, 3, 11); treeAt('florida', 23, 4, 12); treeAt('redonda', 36, 12, 13);
  treeAt('florida', 2, 12, 14); treeAt('redonda', 11, 12, 15); treeAt('florida', 27, 12, 16);
  treeAt('redonda', 2, 19, 17); treeAt('florida', 15, 19, 18); treeAt('redonda', 23, 19, 19);
  treeAt('pinheiro', 13, 27, 20); treeAt('pinheiro', 26, 27, 21); treeAt('redonda', 8, 28, 22);
  put('arbusto-1', P.tree('arbusto', 1), 15, 6, 1, 1);
  put('arbusto-2', P.tree('arbusto', 2), 25, 6, 1, 1);
  put('arbusto-3', P.tree('arbusto', 3), 36, 20, 1, 1);
  put('arbusto-4', P.tree('arbusto', 4), 3, 20, 1, 1);

  // ── praça ──
  putLit('fonte', [0, 1, 2].map(f => T.fountainLit(f)), 18, 13, 4, 2, true, 180);
  putLit('mural', T.noticeBoardLit(), 14, 12, 3, 1);
  put('banco-1', P.bench(), 14, 15, 2, 1);
  put('banco-2', P.bench(), 24, 15, 2, 1);
  putLit('totem-1', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(f => T.totemLit(f)), 13, 18, 1, 1, true, 140);
  putLit('totem-2', [4, 5, 6, 7, 8, 0, 1, 2, 3].map(f => T.totemLit(f)), 26, 18, 1, 1, true, 140);
  const lamp = T.lampLit();
  const glowSpots: GlowSpot[] = [];
  for (const [tx, ty] of [[16, 11], [23, 11], [16, 18], [23, 18], [3, 15], [9, 15], [29, 15], [36, 15]]) {
    putLit(`poste-${tx}-${ty}`, lamp, tx, ty, 1, 1);
    glowSpots.push({ x: tx * TILE + 8, y: ty * TILE + 10, r: 26, color: LED.warm, k: 0.32 });
    glowSpots.push({ x: tx * TILE + 8, y: ty * TILE - 9, r: 10, color: LED.warmSoft, k: 0.35 });
  }
  putLit('maquina', T.vendingLit(), 35, 14, 1, 1);
  for (const [tx, ty, c] of [[13, 15, '#e079a9'], [26, 15, '#ffd84a']] as [number, number, string][]) {
    putLit(`vaso-${tx}-${ty}`, T.planterLit(hex(c)), tx, ty, 1, 1);
  }
  put('placa-arena', P.signPost(), 26, 25, 1, 1);
  put('placa-guildas', P.signPost(), 12, 26, 1, 1);

  // ── casas: correio, cercas, flores ──
  put('correio-sua', P.mailbox(hex('#e84848')), 8, 6, 1, 1);
  put('correio-verde', P.mailbox(hex('#3a9a4a')), 38 - 1, 7, 1, 1);
  put('correio-roxa', P.mailbox(hex('#7e60c0')), 13, 25, 1, 1);
  for (let tx = 2; tx <= 8; tx++) if (tx !== 4) put(`cerca-${tx}`, P.fence(), tx, 7, 1, 1);
  const flores = [hex('#e079a9'), hex('#f4f0f8'), hex('#d77033'), hex('#aa5284')];
  for (const [tx, ty, s] of [[5, 7, 0], [6, 7, 1], [9, 7, 2], [10, 7, 1], [26, 7, 3], [27, 7, 0], [29, 7, 1], [30, 7, 2], [14, 26, 0], [22, 26, 3], [35, 7, 2], [36, 7, 0]]) {
    if (terrain[ty][tx] !== 'grama' || solid[ty][tx]) continue;
    put(`flor-${tx}-${ty}`, P.flowerTile(flores, s), tx, ty, 1, 1, false);
  }
  for (const [tx, ty] of [[17, 19], [22, 19], [12, 19]]) put(`flor-${tx}-${ty}`, P.flowerTile(flores, tx), tx, ty, 1, 1, false);
  // jardim ao lado da Sede das Guildas
  for (let tx = 5; tx <= 9; tx++) for (const ty of [18, 19]) put(`jardim-${tx}-${ty}`, P.flowerTile(flores, tx + ty), tx, ty, 1, 1, false);
  for (let tx = 4; tx <= 10; tx++) put(`cerca-jardim-${tx}`, P.fence(), tx, 20, 1, 1);
  // cantinho do lago
  put('banco-lago', P.bench(), 32, 20, 2, 1);
  putLit('vaso-lago-1', T.planterLit(hex('#ff5a9a')), 31, 20, 1, 1);
  putLit('vaso-lago-2', T.planterLit(hex('#ffe066')), 34, 20, 1, 1);
  // portal de boas-vindas na saída sul
  const arch = T.welcomeArchLit('CIDADE WIT');
  objects.push({ id: 'portal', pix: arch.pix, night: arch.night, x: 18 * TILE, y: 28 * TILE - arch.pix.h, baseY: 28 * TILE });
  block(18, 27, 1, 1); block(21, 27, 1, 1);
  put('pedra-1', P.rock(), 36, 23, 1, 1);
  put('pedra-2', P.rock(), 3, 25, 1, 1);

  // brilho que se mexe no lago
  const lake = { x0: 31 * TILE + 6, y0: 18 * TILE + 5, x1: 38 * TILE - 7, y1: 20 * TILE - 5 };
  const sparkle = (f: number) => {
    const pm = new Pixmap(lake.x1 - lake.x0, lake.y1 - lake.y0);
    for (let k = 0; k < 9; k++) {
      const x = Math.floor(hash(k, f, 3) * (pm.w - 4)), y = Math.floor(hash(f, k, 5) * (pm.h - 1));
      pm.put(x, y, hex('#e4f6ff')); pm.put(x + 1, y, hex('#8ccaf6')); pm.put(x + 2, y, hex('#e4f6ff'));
    }
    return pm;
  };
  objects.push({ id: 'lago-brilho', pix: sparkle(0), x: lake.x0, y: lake.y0, baseY: lake.y0 - 64, frames: [0, 1, 2, 3].map(sparkle), frameMs: 420 });

  // água bloqueia
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (terrain[y][x] === 'agua') solid[y][x] = true;

  // chão de pixel + flores e mato já pintados no chão
  const ground = paintGround(terrain);
  const groundNight = new Pixmap(ground.w, ground.h);
  decoratePlaza(ground, groundNight);
  paintCircuits(ground, groundNight, CIRCUITS);
  objects.sort((a, b) => a.baseY - b.baseY);
  return {
    ground, objects, solid, doors, spawn: { tx: 20, ty: 12 }, terrain,
    lights: composeLights(groundNight, objects.filter(o => !o.frames)),
    circuits: CIRCUITS.map(circuitPixels),
    glowSpots: [...glowSpots, ...buildingGlow],
  };
}

/**
 * Circuitos da calçada (em pixels): saem da porta da Torre e do anel da praça
 * para as três avenidas e para as portas do Centro e da Loja.
 */
const CIRCUITS: Circuit[] = [
  [[316, 178], [316, 201]],
  [[324, 178], [324, 201]],
  [[262, 237], [244, 237], [208, 273], [20, 273]],
  [[378, 237], [396, 237], [432, 273], [639, 273]],
  [[316, 271], [316, 479]],
  [[324, 271], [324, 479]],
  [[120, 273], [120, 244]],
  [[520, 273], [520, 244]],
];

/**
 * Junta as luzes do chão com as dos objetos, na ordem de desenho: um objeto
 * na frente apaga a luz que estiver atrás dele (a árvore tapa a janela).
 */
function composeLights(groundNight: Pixmap, objs: Placed[]): Pixmap {
  const out = new Pixmap(groundNight.w, groundNight.h);
  out.data.set(groundNight.data);
  for (const o of objs) {
    for (let y = 0; y < o.pix.h; y++) for (let x = 0; x < o.pix.w; x++) {
      const si = (y * o.pix.w + x) * 4;
      if (o.pix.data[si + 3] === 0) continue;
      const X = o.x + x, Y = o.y + y;
      if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) continue;
      const di = (Y * out.w + X) * 4;
      if (o.night && o.night.data[si + 3] > 0) {
        out.data[di] = o.night.data[si]; out.data[di + 1] = o.night.data[si + 1]; out.data[di + 2] = o.night.data[si + 2]; out.data[di + 3] = 255;
      } else out.data[di + 3] = 0;
    }
  }
  return out;
}

/** Anel de pedra em volta da fonte, com um circuito no meio que acende à noite. */
function decoratePlaza(pm: Pixmap, nt: Pixmap): void {
  const cx = 20 * TILE, cy = 14 * TILE + 12, rx = 58, ry = 34;
  for (let y = cy - ry - 6; y <= cy + ry + 6; y++) for (let x = cx - rx - 6; x <= cx + rx + 6; x++) {
    const d = Math.sqrt(((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2);
    if (d > 1.08 || d < 0.9) continue;
    let c = (((x >> 3) + (y >> 3)) & 1) ? PAVE.light : hex('#dfe4ec');
    if (d > 1.05) c = PAVE.curb;
    else if (d > 1.03) c = PAVE.joint;
    else if (d < 0.92) c = PAVE.curbLight;
    else if (Math.abs(d - 0.985) < 0.012) { c = hex('#a6b8be'); nt.put(x, y, LED.green); }
    pm.put(x, y, c);
  }
}

/**
 * Desenha a cidade inteira numa imagem (para revisão e miniaturas). Com
 * `hour`, aplica a hora do dia (noite = tinta azul + luzes + halo).
 */
export function renderTown(town: Town, extra: Placed[] = [], hour?: number): Pixmap {
  const out = new Pixmap(town.ground.w, town.ground.h);
  out.blit(town.ground, 0, 0);
  const all = [...town.objects, ...extra].sort((a, b) => a.baseY - b.baseY);
  for (const o of all) out.blit(o.pix, o.x, o.y);
  if (hour === undefined) return out;
  const tod = timeOfDay(hour);
  if (tod.light <= 0 && tod.tint.every(v => v === 255)) return out;
  const lights = new Pixmap(out.w, out.h);
  lights.data.set(town.lights.data);
  for (const o of town.objects) if (o.frames && o.night) lights.blit(o.night, o.x, o.y);
  const halo = lightHalo(lights);
  addGlowSpots(halo, town.glowSpots);
  applyTimeOfDay(out, lights, halo, tod);
  return out;
}

/** Soma as poças de luz (queda suave até a borda) numa imagem de halo. */
export function addGlowSpots(halo: Pixmap, spots: GlowSpot[], down = 1): void {
  for (const s0 of spots) {
    const s = { ...s0, x: s0.x / down, y: s0.y / down, r: s0.r / down };
    for (let y = Math.floor(s.y - s.r); y <= s.y + s.r; y++) for (let x = Math.floor(s.x - s.r); x <= s.x + s.r; x++) {
      if (!halo.inside(x, y)) continue;
      const d = Math.hypot((x + 0.5 - s.x), (y + 0.5 - s.y) * 1.6) / s.r;
      if (d >= 1) continue;
      const f = (1 - d) * (1 - d) * s.k;
      const i = (y * halo.w + x) * 4;
      for (let c = 0; c < 3; c++) halo.data[i + c] = Math.min(255, halo.data[i + c] + s.color[c] * f);
    }
  }
}
