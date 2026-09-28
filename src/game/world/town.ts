// Planta da cidade inicial: terrenos, prédios, objetos, colisão e portas.
// Tudo em coordenadas de bloco (16 px). A arte sai de ground/props/buildings.
import { TILE, type Building } from './buildings';
import { circuitPixels, groundKey, paintCircuits, paintGround, paintGroundHd, type Circuit, type GroundTextures, type Terrain } from './ground';
import { applyTimeOfDay, lightHalo, timeOfDay } from './light';
import { hash, hex, Pixmap } from './pixmap';
import { LED, PAVE } from './palette';
import * as P from './props';
import * as T from './props-tech';
import { swayFrames } from './motion';
import { findPlaque, lampNight, padTo, waterFrames, type Sprite, type WorldAssets } from './assets';
import { drawText, textWidth } from './font';
import { HOUSE_MODELS, NPC_HOUSES } from './content';
import { LED as LEDC, WIT } from './palette';
import { houseHG } from './house-hg';
import { arenaHG, towerHG } from './buildings-hg';
import { cardWorkshop, guildCastle, packShop } from './landmarks';

export const MAP_W = 64;
export const MAP_H = 48;

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
  /** Quadro inicial (para objetos iguais não se mexerem juntos). */
  phase?: number;
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
  /** Só as luzes do chão (circuitos, anel da praça). */
  groundNight: Pixmap;
  /** Pixels de cada circuito da calçada, da Torre para fora (pulsos à noite). */
  circuits: [number, number][][];
  /** Poças de luz no chão (postes), somadas à noite. */
  glowSpots: GlowSpot[];
  /** Onde acontecem os efeitos de ambiente (fumaça, brilhos, borboletas…), em pixels do mundo. */
  fx: Ambient;
}

export interface Ambient {
  /** Topo das chaminés. */
  chimneys: [number, number][];
  /** Janelas e letreiros (onde aparece um brilho de vez em quando, de dia). */
  glints: [number, number][];
  /** Flores e canteiros (borboletas). */
  flowers: [number, number][];
  /** Copa das cerejeiras (pétalas caindo). */
  blossoms: [number, number][];
  /** Copa das árvores redondas (uma folha cai de vez em quando). */
  leaves: [number, number][];
  /** Luz de sinalização que pisca (ponta da antena da Torre). */
  beacons: [number, number][];
  /** Áreas com vaga-lumes à noite. */
  fireflies: { x0: number; y0: number; x1: number; y1: number }[];
}

export interface GlowSpot { x: number; y: number; r: number; color: readonly [number, number, number]; k: number }

/**
 * Monta a cidade. Com `assets` (sprites convertidos do GPT) usa essa arte;
 * sem eles, a arte feita por código. A planta, a colisão e as portas são as
 * mesmas nos dois casos.
 */
export interface BuildOptions {
  /** Modelo da Sua Casa. */
  casa?: string;
  /**
   * Chão hd já pintado (sem o anel e os circuitos da praça), gerado por
   * scripts/mapa/chao-pronto.ts. Só é usado se `groundKey` bater com a planta.
   */
  groundHd?: Pixmap;
  groundKey?: string;
}

export function buildTown(assets?: WorldAssets, opts: BuildOptions = {}): Town {
  const A: WorldAssets = assets ?? {};
  const groundTex: GroundTextures | undefined = A['chao-grama'] && A['chao-areia'] && A['chao-calcada'] && A['chao-agua']
    && A['chao-mato'] && A['chao-flores'] && A['chao-floresta']
    ? {
      grama: A['chao-grama'].pix, areia: A['chao-areia'].pix, calcada: A['chao-calcada'].pix, agua: A['chao-agua'].pix,
      mato: A['chao-mato'].pix, flores: A['chao-flores'].pix, floresta: A['chao-floresta'].pix,
    }
    : undefined;
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
  const fx: Ambient = { chimneys: [], glints: [], flowers: [], blossoms: [], leaves: [], beacons: [], fireflies: [] };
  const building = (b: Building, tx: number, ty: number) => {
    for (const gl of b.glow ?? []) buildingGlow.push({ ...gl, x: tx * TILE + gl.x, y: ty * TILE - b.extraTop + gl.y });
    const ox = tx * TILE + (b.offsetX ?? 0), oy = ty * TILE - b.extraTop;
    if (b.chimney) fx.chimneys.push([ox + b.chimney.x, oy + b.chimney.y]);
    // janelas: pontos acesos da camada da noite, um a cada 10 px no máximo
    if (b.night) {
      const seen = new Set<string>();
      for (let y = 0; y < b.night.h; y++) for (let x = 0; x < b.night.w; x++) {
        if (b.night.data[(y * b.night.w + x) * 4 + 3] === 0) continue;
        const key = `${(x / 10) | 0},${(y / 10) | 0}`;
        if (seen.has(key)) continue;
        seen.add(key);
        fx.glints.push([ox + x, oy + y]);
      }
    }
    objects.push({
      id: b.id, pix: b.pix, x: tx * TILE + (b.offsetX ?? 0), y: ty * TILE - b.extraTop, baseY: (ty + b.tilesH) * TILE,
      frames: b.frames, frameMs: b.frames ? 450 : undefined, night: b.night, nightFrames: b.nightFrames,
    });
    block(tx, ty, b.tilesW, b.tilesH);
    for (const c of b.doorCols) {
      const d = { tx: tx + c, ty: ty + b.tilesH - 1, building: b.id, name: b.name };
      solid[d.ty][d.tx] = false;
      doors.push(d);
    }
  };

  /** Prédio a partir de um sprite (arte centrada embaixo do retângulo), ou a versão por código. */
  const sprB = (name: string, id: string, title: string, tw: number, th: number, doorCols: number[], fallback: () => Building): Building => {
    const sp = A[name];
    if (!sp) return fallback();
    const W = tw * TILE, H = Math.max(sp.pix.h, th * TILE);
    const pix = padTo(sp.pix, W, H);
    // a porta desenhada fica no meio do(s) bloco(s) de porta
    const left = (pix.w - sp.pix.w) >> 1;
    const want = ((doorCols[0] + doorCols[doorCols.length - 1] + 1) / 2) * TILE;
    const offsetX = Math.round(want - (left + (DOOR_X[name] ?? sp.pix.w / 2)));
    const ch = CHIMNEY.has(name) ? chimneyTop(sp.pix) : undefined;
    const chimney = ch ? { x: left + ch.x, y: pix.h - sp.pix.h + ch.y } : undefined;
    return { id, name: title, pix, night: sp.night ? padTo(sp.night, W, H) : undefined, tilesW: tw, tilesH: th, extraTop: pix.h - th * TILE, doorCols, offsetX, chimney };
  };
  /** Objeto a partir de um sprite, ou a versão por código. */
  const sprLit = (name: string, fallback: () => T.Lit): T.Lit => {
    const sp = A[name];
    return sp ? { pix: sp.pix, night: sp.night } : fallback();
  };
  const flipCache = new Map<Sprite, Sprite>();
  const flipped = (sp: Sprite): Sprite => {
    const hit = flipCache.get(sp);
    if (hit) return hit;
    const r = flip0(sp);
    flipCache.set(sp, r);
    return r;
  };
  const flip0 = (sp: Sprite): Sprite => {
    const f1 = (pm: Pixmap) => { const o = new Pixmap(pm.w, pm.h); o.blit(pm, 0, 0, true); return o; };
    const f = (pm: Pixmap) => { const o = f1(pm); if (pm.hd) o.hd = f1(pm.hd); return o; };
    return { pix: f(sp.pix), night: sp.night ? f(sp.night) : undefined };
  };

  // ════════════════════════ planta ════════════════════════
  // Faixas de prédios com a rua logo abaixo (a porta sempre olha para a rua),
  // como nas cidades de Pokémon. A praça da Torre fica no meio.
  const fillT = fill;

  // ── ruas ──
  fillT('trilha', 3, 10, 25, 2);            // rua de cima (oeste)
  fillT('trilha', 36, 10, 25, 2);           // rua de cima (leste)
  fillT('trilha', 26, 12, 2, 3);            // descidas para a praça
  fillT('trilha', 36, 12, 2, 3);
  fillT('trilha', 10, 12, 2, 8);            // ligações rua de cima → avenidas
  fillT('trilha', 51, 12, 2, 8);
  fillT('trilha', 3, 32, 58, 2);            // rua do meio
  fillT('trilha', 10, 22, 2, 10);           // ligações avenidas → rua do meio
  fillT('trilha', 52, 22, 2, 10);
  fillT('trilha', 3, 42, 58, 2);            // rua de baixo
  fillT('trilha', 18, 34, 2, 8);            // ligações rua do meio → rua de baixo
  fillT('trilha', 43, 34, 2, 8);
  fillT('calcada', PLAZA.x0, PLAZA.y0, PLAZA.x1 - PLAZA.x0 + 1, PLAZA.y1 - PLAZA.y0 + 1);   // praça
  fillT('calcada', 2, 20, PLAZA.x0 - 2, 2);                  // avenida oeste
  fillT('calcada', PLAZA.x1 + 1, 20, MAP_W - PLAZA.x1 - 1, 2); // avenida leste (saída)
  fillT('calcada', 31, PLAZA.y1 + 1, 2, MAP_H - PLAZA.y1 - 1); // avenida sul (saída)
  fillT('calcada', 15, 19, 3, 1);           // Oficina → avenida
  fillT('calcada', 45, 19, 3, 1);           // Loja → avenida
  fillT('trilha', 15, 31, 3, 1);            // Castelo → rua
  fillT('trilha', 45, 31, 4, 1);            // Arena → rua
  /** Preenche um desenho ('#' = terreno) a partir de (x0, y0): formas soltas, não retângulos. */
  const shape = (t: Terrain, x0: number, y0: number, rows: string[]) =>
    rows.forEach((r, dy) => [...r].forEach((c, dx) => { if (c === '#') fillT(t, x0 + dx, y0 + dy, 1, 1); }));
  shape('agua', 3, 35, ['...###..', '.######.', '#######.', '########', '.#######', '..####..']);   // lago
  shape('mato', 58, 16, ['.###', '####', '###.']);         // mato alto na saída leste
  shape('mato', 58, 22, ['###.', '####', '.##.']);
  shape('mato', 24, 44, ['.####', '####.']);               // e na saída sul
  shape('mato', 35, 44, ['####.', '.####']);
  fillT('flores', 24, 27, 5, 1);            // canteiros dos parquinhos da praça
  fillT('flores', 35, 27, 5, 1);
  fillT('flores', 58, 37, 3, 3);            // horta do fazendeiro
  // chão de mata na borda (entre as árvores), com as saídas sul e leste
  fillT('floresta', 0, 0, MAP_W, 2);
  fillT('floresta', 0, MAP_H - 2, 30, 2); fillT('floresta', 34, MAP_H - 2, MAP_W - 34, 2);
  fillT('floresta', 0, 0, 2, MAP_H);
  fillT('floresta', MAP_W - 2, 0, 2, 20); fillT('floresta', MAP_W - 2, 22, 2, MAP_H - 22);

  // ── prédios ──
  building(sprB('torre', 'torre', 'Torre dos 100 Andares', 6, 7, [2, 3], towerHG), 29, 8);
  {
    // ponta da antena: o pixel mais alto da arte da Torre
    const tw = objects[objects.length - 1], src = tw.pix;
    let top: [number, number] | undefined;
    for (let y = 0; y < src.h && !top; y++) for (let x = 0; x < src.w; x++) if (src.data[(y * src.w + x) * 4 + 3] > 200) { top = [tw.x + x + 0.5, tw.y + y + 1]; break; }
    if (top) fx.beacons.push(top);
  }
  block(29, 4, 6, 4); // a arte da Torre sobe até aqui: ninguém anda por trás dela
  building(sprB('oficina', 'centro', 'Oficina de Cartas', 7, 5, [3], cardWorkshop), 13, 14);
  building(sprB('palacio-cartas', 'loja', 'Loja de Pacotinhos', 5, 5, [2], packShop), 44, 14);
  building(sprB('castelo', 'guildas', 'Castelo das Guildas', 7, 5, [3], guildCastle), 13, 26);
  building(sprB('arena', 'arena', 'Arena', 8, 5, [3, 4], arenaHG), 43, 26);

  // casas: porta no meio, caminho de areia da porta até a rua, correio e canteiro do lado
  const house = (sprite: string, id: string, title: string, tx: number, ty: number, o: Parameters<typeof houseHG>[2], tw = 5) => {
    const door = tx + Math.floor(tw / 2);
    building(sprB(sprite, id, title, tw, 5, [Math.floor(tw / 2)], () => houseHG(id, title, { ...o, tilesW: tw })), tx, ty);
    fillT('trilha', door, ty + 5, 1, 1);
    return door;
  };
  const casaModel = HOUSE_MODELS.find(m => m.id === opts.casa) ?? HOUSE_MODELS[0];
  const casas: [string, string, string, number, number, Parameters<typeof houseHG>[2]][] = [
    // faixa de cima
    [casaModel.sprite, 'sua-casa', 'Sua Casa', 5, 4, { roof: 'vermelho', wood: 'bege', led: 'green', tech: 'antena' }],
    ['casa-azul', 'casa-azul', 'Casa de um morador', 13, 4, { roof: 'azul', wood: 'branco', led: 'cyan', tech: 'solar' }],
    ['casa-bibliotecaria', 'npc-bibliotecaria', '', 20, 4, { roof: 'verde', wood: 'bege' }],
    ['casa-inventor', 'npc-inventor', '', 39, 4, { roof: 'azul', wood: 'branco', tech: 'solar' }],
    ['casa-rosa', 'casa-rosa', 'Casa de um morador', 46, 4, { roof: 'roxo', wood: 'rosa', led: 'pink' }],
    ['casa-verde', 'casa-verde', 'Casa de um morador', 53, 4, { roof: 'verde', wood: 'bege', led: 'warm', tech: 'solar' }],
    // faixa das avenidas
    ['casa-padaria', 'npc-padaria', '', 4, 14, { roof: 'laranja', wood: 'bege' }],
    ['casa-musico', 'npc-musico', '', 54, 14, { roof: 'roxo', wood: 'branco' }],
    // faixa do meio
    ['casa-artista', 'npc-artista', '', 4, 26, { roof: 'laranja', wood: 'bege' }],
    ['casa-floricultura', 'npc-floricultura', '', 55, 26, { roof: 'vermelho', wood: 'rosa' }],
    // faixa de baixo
    ['casa-pescador', 'npc-pescador', '', 12, 36, { roof: 'azul', wood: 'branco' }],
    ['casa-roxa', 'casa-roxa', 'Casa de um morador', 21, 36, { roof: 'roxo', wood: 'branco', led: 'purple', tech: 'antena' }],
    ['casa-laranja', 'casa-laranja', 'Casa de um morador', 36, 36, { roof: 'laranja', wood: 'bege', led: 'orange', tech: 'solar' }],
    ['casa-vermelha-antena', 'casa-vermelha', 'Casa de um morador', 46, 36, { roof: 'vermelho', wood: 'bege', led: 'green', tech: 'antena' }],
    ['casa-fazendeiro', 'npc-fazendeiro', '', 53, 36, { roof: 'vermelho', wood: 'bege' }],
  ];
  const doorsAt: [number, number][] = [];
  for (const [sprite, id, title, tx, ty, o] of casas) {
    const npc = NPC_HOUSES.find(h => h.id === id);
    doorsAt.push([house(sprite, id, npc?.title ?? title, tx, ty, o), ty + 5]);
  }

  // ── árvores: mata na borda + grupos pela cidade ──
  const TREE_SPRITE: Record<P.TreeKind, string> = { pinheiro: 'pinheiro', redonda: 'arvore-redonda', florida: 'cerejeira', arbusto: 'arbusto' };
  const treePix = (kind: P.TreeKind, seed: number): { pix: Pixmap; night?: Pixmap } => {
    const sp = A[TREE_SPRITE[kind]];
    if (!sp) return { pix: P.tree(kind, seed) };
    return hash(seed, 1, 77) < 0.5 ? flipped(sp) : sp;   // espelha metade, para a mata não parecer carimbo
  };
  const treeAt = (kind: P.TreeKind, tx: number, ty: number, seed: number) => {
    const t = treePix(kind, seed);
    // o vento passa pela cidade como uma onda (fase pela posição)
    const frames = t.pix.hd ? swayFrames(t.pix, kind === 'arbusto' ? 1 : 2, kind === 'arbusto' ? 1 : 0.72) : undefined;
    put(`arvore-${tx}-${ty}`, frames ?? t.pix, tx, ty, kind === 'arbusto' ? 1 : 2, kind === 'arbusto' ? 1 : 2, true, 240);
    const o = objects[objects.length - 1];
    o.night = t.night;
    if (kind === 'florida') fx.blossoms.push([o.x + o.pix.w / 2, o.y + o.pix.h * 0.35]);
    if (kind === 'redonda') fx.leaves.push([o.x + o.pix.w / 2, o.y + o.pix.h * 0.35]);
    if (frames) o.phase = Math.floor(tx * 0.6 + ty * 0.25 + hash(tx, ty, 3) * 1.5);
  };
  const behind = (tx: number, ty: number, seed: number) => {
    const { pix } = treePix('pinheiro', seed);
    objects.push({ id: `mata-${tx}-${ty}`, pix, x: tx * TILE, y: (ty + 2) * TILE - pix.h, baseY: (ty + 2) * TILE - 1000 });
  };
  const southGap = (tx: number) => tx >= 29 && tx <= 33;
  const eastGap = (ty: number) => ty >= 19 && ty <= 21;
  for (let tx = -1; tx < MAP_W; tx += 2) behind(tx, -1, tx + 40);
  for (let tx = -1; tx < MAP_W; tx += 2) if (!southGap(tx) && !southGap(tx + 1)) behind(tx, MAP_H - 1, tx + 60);
  for (let ty = 1; ty < MAP_H; ty += 2) { behind(-1, ty, ty + 80); if (!eastGap(ty) && !eastGap(ty + 1)) behind(MAP_W - 1, ty, ty + 90); }
  for (let tx = 0; tx < MAP_W; tx += 2) {
    treeAt('pinheiro', tx, 0, tx);
    if (!southGap(tx) && !southGap(tx + 1)) treeAt('pinheiro', tx, MAP_H - 2, tx + 1);
  }
  for (let ty = 2; ty < MAP_H - 2; ty += 2) {
    treeAt('pinheiro', 0, ty, ty + 3);
    if (!eastGap(ty) && !eastGap(ty + 1)) treeAt('pinheiro', MAP_W - 2, ty, ty + 5);
  }
  block(0, 0, MAP_W, 2); block(0, MAP_H - 2, 30, 2); block(34, MAP_H - 2, MAP_W - 34, 2);
  block(0, 0, 2, MAP_H); block(MAP_W - 2, 0, 2, 20); block(MAP_W - 2, 22, 2, MAP_H - 22);
  const groves: [P.TreeKind, number, number][] = [
    // faixa verde entre a rua de cima e a das avenidas
    ['redonda', 2, 12], ['florida', 20, 12], ['redonda', 23, 12], ['redonda', 39, 12], ['florida', 42, 12], ['redonda', 56, 12],
    // entre as avenidas e a faixa do meio
    ['florida', 2, 22], ['redonda', 20, 22], ['redonda', 41, 22], ['florida', 48, 22],
    // parquinhos dos lados da avenida sul
    ['redonda', 23, 28], ['florida', 27, 29], ['redonda', 38, 28], ['florida', 34, 29],
    // entre a rua do meio e a faixa de baixo
    ['redonda', 27, 34], ['florida', 34, 34], ['redonda', 50, 34], ['pinheiro', 58, 33],
    // borda de baixo
    ['redonda', 4, 44], ['florida', 9, 44], ['pinheiro', 14, 44], ['redonda', 19, 44],
    ['redonda', 42, 44], ['florida', 47, 44], ['pinheiro', 52, 44], ['redonda', 57, 44],
  ];
  groves.forEach(([k, tx, ty], i) => treeAt(k, tx, ty, 100 + i));
  for (const [tx, ty] of [[9, 12], [25, 12], [38, 13], [49, 12], [9, 24], [22, 24], [40, 24], [51, 24], [12, 34], [25, 35], [41, 34], [60, 34]] as [number, number][]) {
    treeAt('arbusto', tx, ty, tx * 7 + ty);
  }

  // ── praça ──
  const fountainArt = A.fonte ? waterFrames(A.fonte) : [0, 1, 2].map(f => T.fountainLit(f));
  putLit('fonte', fountainArt, FOUNTAIN.tx, FOUNTAIN.ty, 4, 2, true, 180);
  const fo = objects[objects.length - 1];
  const wc = waterCenter(fo.pix);
  const ring = { cx: Math.round(fo.x + wc.x), cy: Math.round(fo.y + wc.y) };
  putLit('mural', A.mural ? labeled(A.mural, 'MURAL') : T.noticeBoardLit(), 24, 16, 3, 1);
  const bench = sprLit('banco', () => ({ pix: P.bench() }));
  putLit('banco-1', bench, 25, 22, 2, 1);
  putLit('banco-2', bench, 37, 22, 2, 1);
  const bin = sprLit('lixeira', () => ({ pix: P.rock() }));
  for (const [tx, ty] of [[24, 22], [39, 22], [9, 41]]) putLit(`lixeira-${tx}-${ty}`, bin, tx, ty, 1, 1);
  const totem = (off: number) => A.totem ? { pix: A.totem.pix, night: A.totem.night } : [0, 1, 2, 3, 4, 5, 6, 7, 8].map(f => T.totemLit((f + off) % 9));
  putLit('totem-1', totem(0), 29, 25, 1, 1, true, 140);
  putLit('totem-2', totem(4), 34, 25, 1, 1, true, 140);
  for (const [tx, ty, c] of [[23, 15, '#e079a9'], [40, 15, '#ffd84a'], [23, 25, '#ff5a9a'], [40, 25, '#b07cff']] as [number, number, string][]) {
    putLit(`vaso-${tx}-${ty}`, sprLit('vaso', () => T.planterLit(hex(c))), tx, ty, 1, 1);
  }
  const lamp = A.poste ? { pix: A.poste.pix, night: lampNight(A.poste, 9) } : T.lampLit();
  const glowSpots: GlowSpot[] = [];
  const lamps: [number, number][] = [
    [28, 16], [35, 16], [28, 24], [35, 24],                    // praça
    [3, 19], [12, 22], [21, 19], [42, 22], [50, 19], [60, 19], // avenidas
    [30, 28], [33, 36], [30, 41],                              // avenida sul
    [12, 9], [25, 9], [38, 9], [58, 9], [8, 31], [56, 31], [16, 41], [49, 41], // ruas
  ];
  for (const [tx, ty] of lamps) {
    putLit(`poste-${tx}-${ty}`, lamp, tx, ty, 1, 1);
    glowSpots.push({ x: tx * TILE + 8, y: ty * TILE + 10, r: 26, color: LED.warm, k: 0.32 });
    glowSpots.push({ x: tx * TILE + 8, y: ty * TILE - 9, r: 10, color: LED.warmSoft, k: 0.35 });
  }
  putLit('maquina', sprLit('maquina', T.vendingLit), 49, 18, 1, 1);
  const sign = sprLit('placa', () => ({ pix: P.signPost() }));
  putLit('placa-guildas', sign, 12, 31, 1, 1);
  putLit('placa-arena', sign, 51, 31, 1, 1);
  putLit('placa-lago', sign, 11, 41, 1, 1);

  // ── casas: correio do lado do caminho, canteiros, a cerca da Sua Casa ──
  const mail = (c: string) => sprLit('correio', () => ({ pix: P.mailbox(hex(c)) }));
  const mailColors = ['#e84848', '#4a78c8', '#3a9a4a', '#7e60c0', '#d07040'];
  const flores = [hex('#e079a9'), hex('#f4f0f8'), hex('#d77033'), hex('#aa5284')];
  const flower = (s: number) => sprLit('tulipas', () => ({ pix: P.flowerTile(flores, s) }));
  const fence = sprLit('cerca', () => ({ pix: P.fence() }));
  for (let tx = 3; tx <= 11; tx++) if (tx !== 7 && tx !== 8) putLit(`cerca-${tx}`, fence, tx, 9, 1, 1);
  // horta do fazendeiro: cerca em cima e embaixo (a cerca é uma peça deitada; em pé ela fica picotada)
  for (let tx = 58; tx <= 60; tx++) { putLit(`cerca-horta-${tx}-36`, fence, tx, 36, 1, 1); putLit(`cerca-horta-${tx}-40`, fence, tx, 40, 1, 1); }
  doorsAt.forEach(([dx, sy], i) => {
    if (!solid[sy][dx + 1] && terrain[sy][dx + 1] === 'grama') putLit(`correio-${dx}`, mail(mailColors[i % mailColors.length]), dx + 1, sy, 1, 1);
    for (const fx of [dx - 2, dx + 2]) {
      if (fx < 0 || solid[sy][fx] || terrain[sy][fx] !== 'grama') continue;
      putLit(`flor-${fx}-${sy}`, flower(fx + sy), fx, sy, 1, 1, false);
    }
  });
  // flores de canteiro (arte por código, quando não há a textura de flores)
  if (!groundTex) {
    for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
      if (terrain[ty][tx] === 'flores') put(`canteiro-${tx}-${ty}`, P.flowerTile(flores, tx + ty), tx, ty, 1, 1, false);
    }
  }
  // cantinho do lago
  putLit('banco-lago', bench, 5, 41, 2, 1);
  if (A['chao-agua']) {
    // píer de madeira saindo da margem direita e taboas na beira do lago (arte em hd, por código)
    const pier = pierArt();
    objects.push({ id: 'pier', pix: pier, x: 11 * TILE - pier.w, y: 38 * TILE - 2, baseY: 35 * TILE });
    for (const [tx, ty, seed] of [[2, 37, 1], [2, 38, 2], [11, 37, 3], [4, 35, 4], [9, 35, 5], [3, 40, 6], [10, 40, 7]] as [number, number, number][]) {
      if (terrain[ty]?.[tx] !== 'grama' || solid[ty]?.[tx]) continue;
      put(`taboa-${tx}-${ty}`, swayFrames(reedArt(seed), 2, 1, 8), tx, ty, 1, 1, false, 230);
      objects[objects.length - 1].phase = seed * 3;
    }
  }
  // portal de boas-vindas na saída sul
  const arch = A.portal ? labeled(A.portal, 'CIDADE WIT') : T.welcomeArchLit('CIDADE WIT');
  objects.push({ id: 'portal', pix: arch.pix, night: arch.night, x: 30 * TILE + ((64 - arch.pix.w) >> 1), y: 45 * TILE - arch.pix.h + 16, baseY: 46 * TILE });
  block(30, 45, 1, 1); block(33, 45, 1, 1);
  const rock = sprLit('pedra', () => ({ pix: P.rock() }));
  putLit('pedra-1', rock, 11, 36, 1, 1);
  putLit('pedra-2', rock, 60, 30, 1, 1);
  /** Enfeite de chão; flor, mato e arbusto balançam com o vento. */
  const SWAYS = new Set(['tulipas', 'mato', 'arbusto-florido']);
  const decor = (id: string, name: string, tx: number, ty: number) => {
    const sp = A[name];
    if (name === 'tulipas' || name === 'arbusto-florido') fx.flowers.push([tx * TILE + 8, ty * TILE + 6]);
    if (SWAYS.has(name) && sp.pix.hd) {
      put(id, swayFrames(sp.pix, 1, 1, 8), tx, ty, 1, 1, false, 200);
      objects[objects.length - 1].phase = Math.floor(tx * 0.6 + ty * 0.25 + hash(tx, ty, 5) * 2);
    } else putLit(id, { pix: sp.pix, night: sp.night }, tx, ty, 1, 1, false);
  };
  // enfeites da natureza (só com os sprites novos; dá para pisar)
  const deco: [string, number, number][] = [
    ['toco', 3, 25], ['cogumelos', 22, 13], ['pedrinhas', 2, 34], ['arbusto-florido', 26, 30], ['cogumelos', 44, 13],
    ['toco', 60, 27], ['arbusto-florido', 37, 30], ['pedrinhas', 11, 38], ['cogumelos', 5, 45], ['toco', 55, 45],
    ['arbusto-florido', 21, 25], ['arbusto-florido', 42, 25], ['pedrinhas', 40, 43], ['cogumelos', 59, 13],
  ];
  for (const [name, tx, ty] of deco) {
    if (!A[name] || solid[ty]?.[tx] || terrain[ty]?.[tx] !== 'grama') continue;
    decor(`${name}-${tx}-${ty}`, name, tx, ty);
  }

  // flores e enfeites espalhados pelo gramado (longe de rua, porta e morador)
  if (A.tulipas) {
    const kinds = ['tulipas', 'tulipas', 'arbusto-florido', 'tulipas', 'cogumelos', 'pedrinhas', 'mato'];
    const taken = new Set(objects.map(o => `${Math.floor((o.x + o.pix.w / 2) / TILE)},${Math.floor(o.baseY / TILE) - 1}`));
    const nearRoad = (tx: number, ty: number) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const t = terrain[ty + dy]?.[tx + dx];
        if (t && t !== 'grama') return true;
      }
      return false;
    };
    for (let ty = 3; ty < MAP_H - 3; ty++) for (let tx = 3; tx < MAP_W - 3; tx++) {
      if (terrain[ty][tx] !== 'grama' || solid[ty][tx] || solid[ty + 1]?.[tx] || nearRoad(tx, ty) || taken.has(`${tx},${ty}`)) continue;
      if (hash(tx, ty, 131) > 0.07) continue;
      const name = kinds[Math.floor(hash(ty, tx, 7) * kinds.length)];
      if (!A[name]) continue;
      decor(`enfeite-${tx}-${ty}`, name, tx, ty);
    }
  }

  // brilho que se mexe no lago
  const lake = { x0: 3 * TILE + 8, y0: 35 * TILE + 10, x1: 11 * TILE - 8, y1: 41 * TILE - 10 };
  const sparkle = (f: number) => {
    const pm = new Pixmap(lake.x1 - lake.x0, lake.y1 - lake.y0);
    for (let k = 0; k < 16; k++) {
      const x = Math.floor(hash(k, f, 3) * (pm.w - 4)), y = Math.floor(hash(f, k, 5) * (pm.h - 1));
      pm.put(x, y, hex('#e4f6ff')); pm.put(x + 1, y, hex('#8ccaf6')); pm.put(x + 2, y, hex('#e4f6ff'));
    }
    return pm;
  };
  objects.push({ id: 'lago-brilho', pix: sparkle(0), x: lake.x0, y: lake.y0, baseY: lake.y0 - 64, frames: [0, 1, 2, 3].map(sparkle), frameMs: 420 });

  // água bloqueia
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (terrain[y][x] === 'agua') solid[y][x] = true;

  // chão + anel da praça + circuitos
  // com texturas hd, pinta só o chão hd e a versão normal sai dele (reduzida):
  // pintar os dois custava o dobro no carregamento
  const ready = opts.groundHd && opts.groundKey === groundKey(terrain) && opts.groundHd.w === MAP_W * TILE * 2 ? opts.groundHd : undefined;
  if (opts.groundHd && !ready) console.warn('chão pronto desatualizado: rode npx vite-node scripts/mapa/chao-pronto.ts');
  const groundBig = ready ? copyOf(ready) : groundTex ? paintGroundHd(terrain, groundTex) : undefined;
  const ground = groundBig ? halve(groundBig) : paintGround(terrain, groundTex);
  if (groundBig) ground.hd = groundBig;
  const groundNight = new Pixmap(ground.w, ground.h);
  decoratePlaza(ground, groundNight, ring.cx, ring.cy);
  const circuits = plazaCircuits(ring.cx, ring.cy);
  paintCircuits(ground, groundNight, circuits);
  if (ground.hd) {
    // anel e circuitos redesenhados em hd (traço fino, curva lisa), de dia e à noite
    groundNight.hd = new Pixmap(ground.hd.w, ground.hd.h);
    decoratePlaza(ground.hd, groundNight.hd, ring.cx * 2, ring.cy * 2, 2);
    paintCircuits(ground.hd, groundNight.hd, circuits.map(c => c.map(([x, y]) => [x * 2, y * 2] as [number, number])));
    // água do lago em movimento (substitui o brilho simples)
    const agua = A['chao-agua']?.pix.hd;
    if (agua) {
      const i = objects.findIndex(o => o.id === 'lago-brilho');
      const box = { x0: 2 * TILE, y0: 34 * TILE, x1: 12 * TILE, y1: 42 * TILE };
      const frames = lakeFrames(ground.hd, agua, box);
      const o: Placed = { id: 'lago-agua', pix: frames[0], x: box.x0, y: box.y0, baseY: box.y0 - 64, frames, frameMs: 180 };
      if (i >= 0) objects[i] = o; else objects.push(o);
    }
  }
  // canteiros também chamam borboleta; vaga-lumes no lago, no mato alto e na beira da mata
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    if (terrain[ty][tx] === 'flores' && hash(tx, ty, 17) < 0.35) fx.flowers.push([tx * TILE + 8, ty * TILE + 6]);
    if (terrain[ty][tx] === 'mato' && hash(tx, ty, 18) < 0.5) fx.fireflies.push({ x0: tx * TILE, y0: ty * TILE - 8, x1: tx * TILE + 16, y1: ty * TILE + 12 });
  }
  fx.fireflies.push({ x0: 3 * TILE, y0: 34 * TILE, x1: 11 * TILE, y1: 41 * TILE });
  for (let tx = 4; tx < MAP_W - 4; tx += 5) {
    fx.fireflies.push({ x0: tx * TILE, y0: 2 * TILE, x1: tx * TILE + 48, y1: 3 * TILE });
    if (!(tx >= 26 && tx <= 36)) fx.fireflies.push({ x0: tx * TILE, y0: (MAP_H - 3) * TILE, x1: tx * TILE + 48, y1: (MAP_H - 2) * TILE });
  }
  objects.sort((a, b) => a.baseY - b.baseY);
  return {
    fx,
    ground, objects, solid, doors, spawn: { tx: 31, ty: 23 }, terrain,
    lights: composeLights(groundNight, objects.filter(o => !o.frames)),
    groundNight,
    circuits: circuits.map(circuitPixels),
    glowSpots: [...glowSpots, ...buildingGlow],
  };
}

/**
 * Onde fica o meio da porta em cada sprite (px a partir da esquerda), medido
 * nas imagens; os que não estão aqui têm a porta no meio da arte.
 */
const DOOR_X: Record<string, number> = {
  'casa-azul': 36, 'casa-chale': 37, 'casa-laranja': 36.5, 'casa-roxa': 36.5, 'casa-verde': 37,
  'casa-vermelha-antena': 36.5, 'casa-padaria': 48, 'casa-moderna': 47, 'casa-floricultura': 34.5,
  'casa-rosa': 36, torre: 43.5, oficina: 55.5,
};

/** Praça da Torre (em blocos) e o lugar da fonte. */
export const PLAZA = { x0: 23, y0: 15, x1: 40, y1: 25 };
const FOUNTAIN = { tx: 30, ty: 19 };
const RING = { rx: 58, ry: 34 };

/** Centro da água de um sprite de fonte (média dos pixels azuis), relativo à arte. */
function waterCenter(pm: Pixmap): { x: number; y: number } {
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const c = pm.get(x, y);
    if (!c || !(c[2] > 170 && c[2] > c[0] + 50)) continue;
    sx += x; sy += y; n++;
  }
  return n ? { x: sx / n, y: sy / n } : { x: pm.w / 2, y: pm.h * 0.6 };
}

/**
 * Circuitos da calçada (em pixels): saem da porta da Torre e do anel da praça
 * para as três avenidas e para as portas da Oficina e da Loja.
 */
function plazaCircuits(cx: number, cy: number): Circuit[] {
  const avenueY = 21 * TILE;            // meio das avenidas (linhas 20 e 21)
  const left = cx - RING.rx, right = cx + RING.rx;
  const dy = avenueY - cy;
  const tower = PLAZA.y0 * TILE + 2;
  return [
    [[cx - 4, tower], [cx - 4, cy - RING.ry + 1]],
    [[cx + 4, tower], [cx + 4, cy - RING.ry + 1]],
    [[left + 1, cy], [left - 18, cy], [left - 18 - dy, avenueY], [2 * TILE + 4, avenueY]],
    [[right - 1, cy], [right + 18, cy], [right + 18 + dy, avenueY], [MAP_W * TILE - 1, avenueY]],
    [[cx - 4, cy + RING.ry], [cx - 4, MAP_H * TILE - 1]],
    [[cx + 4, cy + RING.ry], [cx + 4, MAP_H * TILE - 1]],
    [[16 * TILE + 8, avenueY], [16 * TILE + 8, 19 * TILE + 3]],
    [[46 * TILE + 8, avenueY], [46 * TILE + 8, 19 * TILE + 3]],
  ];
}

/**
 * Junta as luzes do chão com as dos objetos, na ordem de desenho: um objeto
 * na frente apaga a luz que estiver atrás dele (a árvore tapa a janela).
 */
function composeLights(groundNight: Pixmap, objs: Placed[]): Pixmap {
  const out = new Pixmap(groundNight.w, groundNight.h);
  out.data.set(groundNight.data);
  for (const o of objs) {
    const pix = o.pix, night = o.night;
    for (let y = 0; y < pix.h; y++) for (let x = 0; x < pix.w; x++) {
      const si = (y * pix.w + x) * 4;
      if (pix.data[si + 3] === 0) continue;
      const X = o.x + x, Y = o.y + y;
      if (X < 0 || Y < 0 || X >= out.w || Y >= out.h) continue;
      const di = (Y * out.w + X) * 4;
      if (night && night.data[si + 3] > 0) {
        out.data[di] = night.data[si]; out.data[di + 1] = night.data[si + 1]; out.data[di + 2] = night.data[si + 2]; out.data[di + 3] = 255;
      } else out.data[di + 3] = 0;
    }
  }
  return out;
}


/** Escreve `text` na placa lisa (verde-escura) de um sprite; à noite o texto acende. */
function labeled(sp: Sprite, text: string): T.Lit {
  const one = labelOne(sp.pix, sp.night, text);
  // hd: o texto é escrito de novo na placa da arte grande, com letra fina (1 px da fonte = 1 px hd)
  if (sp.pix.hd) {
    const big = labelOne(sp.pix.hd, sp.night?.hd, text);
    one.pix.hd = big.pix;
    one.night!.hd = big.night;
  }
  return one;
}

/** Escreve na placa verde-escura de uma arte (e acende a placa na camada da noite). */
function labelOne(src: Pixmap, srcNight: Pixmap | undefined, text: string): { pix: Pixmap; night: Pixmap } {
  const pix = new Pixmap(src.w, src.h); pix.data.set(src.data);
  const night = new Pixmap(src.w, src.h); if (srcNight) night.data.set(srcNight.data);
  const box = findPlaque(pix, c => c[1] > c[0] + 20 && c[1] > c[2] + 10 && c[1] < 150);
  if (!box) return { pix, night };
  let t = text;
  if (textWidth(t) > box.x1 - box.x0 - 2) t = t.split(' ').pop()!;
  const w = textWidth(t), x = Math.round((box.x0 + box.x1 + 1) / 2 - w / 2), y = Math.round((box.y0 + box.y1 + 1) / 2 - 3.5);
  for (let yy = box.y0; yy <= box.y1; yy++) for (let xx = box.x0; xx <= box.x1; xx++) {
    const c = pix.get(xx, yy);
    if (c && c[1] > c[0] + 20 && c[1] < 150) night.put(xx, yy, c);
  }
  drawText(pix, t, x, y, { fill: [255, 255, 255], fillBottom: WIT.limeLight, shadow: WIT.deep });
  drawText(night, t, x, y, { fill: [255, 255, 255], fillBottom: LEDC.greenSoft, shadow: WIT.deep });
  return { pix, night };
}


/** Anel de pedra em volta da fonte, com um circuito no meio que acende à noite. */
function decoratePlaza(pm: Pixmap, nt: Pixmap, cx: number, cy: number, k = 1): void {
  const rx = RING.rx * k, ry = RING.ry * k, sh = 2 + k;
  for (let y = cy - ry - 6 * k; y <= cy + ry + 6 * k; y++) for (let x = cx - rx - 6 * k; x <= cx + rx + 6 * k; x++) {
    const d = Math.sqrt(((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2);
    if (d > 1.08 || d < 0.9) continue;
    let c = (((x >> sh) + (y >> sh)) & 1) ? PAVE.light : hex('#dfe4ec');
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

/** Reduz uma imagem pela metade (média de cada 2 × 2). */
function halve(pm: Pixmap): Pixmap {
  const out = new Pixmap(pm.w >> 1, pm.h >> 1), s = pm.data, d = out.data, W = pm.w;
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    const i = (y * 2 * W + x * 2) * 4, j = i + W * 4, o = (y * out.w + x) * 4;
    for (let c = 0; c < 4; c++) d[o + c] = (s[i + c] + s[i + 4 + c] + s[j + c] + s[j + 4 + c] + 2) >> 2;
  }
  return out;
}

/**
 * Quadros da água do lago: cada pixel de água (azul) do chão hd pega a textura
 * de água deslocada num vaivém lento, mantendo o claro/escuro que tinha
 * (espuma da borda, sombra da margem), e ganha brilhinhos que correm.
 * A arte normal (1×) fica vazia: a água só se mexe em hd.
 */
function lakeFrames(groundHd: Pixmap, tex: Pixmap, box: { x0: number; y0: number; x1: number; y1: number }, n = 12): Pixmap[] {
  const W = (box.x1 - box.x0) * 2, H = (box.y1 - box.y0) * 2, X0 = box.x0 * 2, Y0 = box.y0 * 2;
  const g = groundHd.data, t = tex.data;
  const lum = (d: Uint8ClampedArray, i: number) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
  const water: number[] = [], shade: number[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const gi = ((Y0 + y) * groundHd.w + X0 + x) * 4;
    // água: azul de verdade (a grama menta também tem muito azul, mas menos que verde)
    if (!(g[gi + 2] > 150 && g[gi + 2] > g[gi + 1] + 8 && g[gi + 2] > g[gi] + 60)) continue;
    const ti = (((Y0 + y) % tex.h) * tex.w + ((X0 + x) % tex.w)) * 4;
    water.push(y * W + x);
    shade.push(Math.max(0.6, Math.min(1.7, lum(g, gi) / Math.max(1, lum(t, ti)))));
  }
  const frames: Pixmap[] = [];
  for (let f = 0; f < n; f++) {
    const a = (2 * Math.PI * f) / n;
    const dx = Math.round(3 * Math.sin(a)), dy = Math.round(2 * Math.sin(a + Math.PI / 2));
    const hd = new Pixmap(W, H), d = hd.data;
    water.forEach((p, k) => {
      const x = p % W, y = (p / W) | 0;
      const tx = ((X0 + x + dx) % tex.w + tex.w) % tex.w, ty = ((Y0 + y + dy) % tex.h + tex.h) % tex.h;
      const ti = (ty * tex.w + tx) * 4, o = p * 4, s = shade[k];
      d[o] = t[ti] * s; d[o + 1] = t[ti + 1] * s; d[o + 2] = t[ti + 2] * s; d[o + 3] = 255;
    });
    // brilhinhos: traços claros que andam devagar para a direita
    for (let s = 0; s < 22; s++) {
      const bx = Math.floor(hash(s, 1, 71) * W), by = Math.floor(hash(s, 2, 71) * H);
      const x = (bx + f * 2) % W, life = (f + s) % n;
      if (life > n * 0.6) continue;
      const len = life < 2 || life > n * 0.5 ? 2 : 4;
      for (let q = 0; q < len; q++) {
        const p = by * W + ((x + q) % W), o = p * 4;
        if (d[o + 3] === 0) continue;
        d[o] = 240; d[o + 1] = 251; d[o + 2] = 255;
      }
    }
    const one = new Pixmap(W >> 1, H >> 1);
    one.hd = hd;
    frames.push(one);
  }
  return frames;
}

/** Sprites que têm chaminé (os outros têm antena, bandeira ou nada no telhado). */
const CHIMNEY = new Set(['casa-azul', 'casa-chale', 'casa-laranja', 'casa-roxa', 'casa-verde', 'casa-vermelha-antena', 'casa-tijolo',
  'casa-rosa', 'casa-padaria', 'casa-pescador', 'casa-musico', 'casa-bibliotecaria', 'casa-artista', 'casa-inventor',
  'casa-montanha', 'casa-floricultura']);

/** Topo da chaminé: o primeiro trecho cinza (pedra) no alto da arte, em px da arte normal. */
function chimneyTop(pm: Pixmap): { x: number; y: number } | undefined {
  const src = pm.hd ?? pm, k = pm.hd ? 2 : 1;
  for (let y = 0; y < src.h * 0.45; y++) {
    const xs: number[] = [];
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4, d = src.data;
      if (d[i + 3] < 200) continue;
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), l = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (mx - mn < 28 && l > 70 && l < 215) xs.push(x);
    }
    if (xs.length >= 4) return { x: xs[xs.length >> 1] / k, y: y / k };
  }
  return undefined;
}

/** Píer de tábuas (hd), para a margem do lago. */
function pierArt(): Pixmap {
  const W = 30 * 2, H = 18 * 2, hd = new Pixmap(W, H);
  const plank = hex('#b88a52'), light = hex('#d8ac6e'), dark = hex('#7a5430'), gap = hex('#5a3c22'), post = hex('#6a4626');
  // postes na água
  for (const px of [4, 26, 48]) { hd.rect(px, 22, 5, 12, post); hd.rect(px, 32, 5, 2, hex('#2e6aa8')); }
  // tábuas na vertical (o píer vai da margem para a esquerda)
  for (let x = 0; x < W; x++) for (let y = 4; y < 24; y++) {
    const col = x % 8;
    const c = col === 7 ? gap : y === 4 || y === 5 ? light : y >= 21 ? dark : col === 0 ? light : plank;
    hd.put(x, y, c);
  }
  // pregos e veios
  for (let x = 3; x < W; x += 8) { hd.put(x, 7, dark); hd.put(x, 19, dark); hd.put(x + 2, 12, hex('#a07444')); hd.put(x + 1, 15, hex('#a07444')); }
  // borda de cima e sombra na água
  hd.rect(0, 3, W, 1, dark);
  for (let x = 0; x < W; x++) { hd.put(x, 24, hex('#2e5e96')); hd.put(x, 25, hex('#3a74b0')); }
  return withHd(hd);
}

/** Taboas (capim de beira d'água com a espiga marrom), hd. */
function reedArt(seed: number): Pixmap {
  const W = 16 * 2, H = 16 * 2, hd = new Pixmap(W, H);
  const blade = [hex('#2f7a3a'), hex('#46a04a'), hex('#6cc460')];
  for (let b = 0; b < 7; b++) {
    const x0 = 6 + Math.floor(hash(seed, b, 1) * 20), h = 12 + Math.floor(hash(seed, b, 2) * 14), lean = (hash(seed, b, 3) - 0.5) * 0.5;
    for (let y = 0; y < h; y++) {
      const x = Math.round(x0 + lean * y);
      hd.put(x, H - 1 - y, blade[(b + (y > h * 0.6 ? 1 : 0)) % 3]);
      if (y < h * 0.5) hd.put(x + 1, H - 1 - y, blade[0]);
    }
    if (b % 2 === 0) {
      const x = Math.round(x0 + lean * h), top = H - h - 6;
      hd.rect(x - 1, top, 3, 6, hex('#7a4a26'));
      hd.put(x, top, hex('#a86a38')); hd.put(x, top - 1, blade[1]); hd.put(x, top - 2, blade[1]);
    }
  }
  return withHd(hd);
}

/** Arte feita direto em hd: a normal é ela reduzida, e leva a hd junto. */
function withHd(hd: Pixmap): Pixmap {
  const one = halve(hd);
  one.hd = hd;
  return one;
}

function copyOf(pm: Pixmap): Pixmap {
  const o = new Pixmap(pm.w, pm.h);
  o.data.set(pm.data);
  return o;
}
