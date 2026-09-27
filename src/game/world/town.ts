// Planta da cidade inicial: terrenos, prédios, objetos, colisão e portas.
// Tudo em coordenadas de bloco (16 px). A arte sai de ground/props/buildings.
import { TILE, type Building } from './buildings';
import { circuitPixels, paintCircuits, paintGround, type Circuit, type GroundTextures, type Terrain } from './ground';
import { applyTimeOfDay, lightHalo, timeOfDay } from './light';
import { hash, hex, Pixmap } from './pixmap';
import { LED, PAVE } from './palette';
import * as P from './props';
import * as T from './props-tech';
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

/**
 * Monta a cidade. Com `assets` (sprites convertidos do GPT) usa essa arte;
 * sem eles, a arte feita por código. A planta, a colisão e as portas são as
 * mesmas nos dois casos.
 */
export function buildTown(assets?: WorldAssets, opts: { casa?: string } = {}): Town {
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
  const building = (b: Building, tx: number, ty: number) => {
    for (const gl of b.glow ?? []) buildingGlow.push({ ...gl, x: tx * TILE + gl.x, y: ty * TILE - b.extraTop + gl.y });
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
    return { id, name: title, pix, night: sp.night ? padTo(sp.night, W, H) : undefined, tilesW: tw, tilesH: th, extraTop: pix.h - th * TILE, doorCols, offsetX };
  };
  /** Objeto a partir de um sprite, ou a versão por código. */
  const sprLit = (name: string, fallback: () => T.Lit): T.Lit => {
    const sp = A[name];
    return sp ? { pix: sp.pix, night: sp.night } : fallback();
  };
  const flipped = (sp: Sprite): Sprite => {
    const f = (pm: Pixmap) => { const o = new Pixmap(pm.w, pm.h); o.blit(pm, 0, 0, true); return o; };
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
    put(`arvore-${tx}-${ty}`, t.pix, tx, ty, kind === 'arbusto' ? 1 : 2, kind === 'arbusto' ? 1 : 2);
    objects[objects.length - 1].night = t.night;
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
  for (let ty = 36; ty <= 40; ty++) putLit(`cerca-horta-${ty}`, fence, 61, ty, 1, 1);
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
  // portal de boas-vindas na saída sul
  const arch = A.portal ? labeled(A.portal, 'CIDADE WIT') : T.welcomeArchLit('CIDADE WIT');
  objects.push({ id: 'portal', pix: arch.pix, night: arch.night, x: 30 * TILE + ((64 - arch.pix.w) >> 1), y: 45 * TILE - arch.pix.h + 16, baseY: 46 * TILE });
  block(30, 45, 1, 1); block(33, 45, 1, 1);
  const rock = sprLit('pedra', () => ({ pix: P.rock() }));
  putLit('pedra-1', rock, 11, 36, 1, 1);
  putLit('pedra-2', rock, 60, 30, 1, 1);
  // enfeites da natureza (só com os sprites novos; dá para pisar)
  const deco: [string, number, number][] = [
    ['toco', 3, 25], ['cogumelos', 22, 13], ['pedrinhas', 2, 34], ['arbusto-florido', 26, 30], ['cogumelos', 44, 13],
    ['toco', 60, 27], ['arbusto-florido', 37, 30], ['pedrinhas', 11, 38], ['cogumelos', 5, 45], ['toco', 55, 45],
    ['arbusto-florido', 21, 25], ['arbusto-florido', 42, 25], ['pedrinhas', 40, 43], ['cogumelos', 59, 13],
  ];
  for (const [name, tx, ty] of deco) {
    if (!A[name] || solid[ty]?.[tx] || terrain[ty]?.[tx] !== 'grama') continue;
    putLit(`${name}-${tx}-${ty}`, { pix: A[name].pix, night: A[name].night }, tx, ty, 1, 1, false);
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
      putLit(`enfeite-${tx}-${ty}`, { pix: A[name].pix, night: A[name].night }, tx, ty, 1, 1, false);
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
  const ground = paintGround(terrain, groundTex);
  const groundNight = new Pixmap(ground.w, ground.h);
  decoratePlaza(ground, groundNight, ring.cx, ring.cy);
  const circuits = plazaCircuits(ring.cx, ring.cy);
  paintCircuits(ground, groundNight, circuits);
  objects.sort((a, b) => a.baseY - b.baseY);
  return {
    ground, objects, solid, doors, spawn: { tx: 31, ty: 23 }, terrain,
    lights: composeLights(groundNight, objects.filter(o => !o.frames)),
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

/** Escreve `text` na placa lisa (verde-escura) de um sprite; à noite o texto acende. */
function labeled(sp: Sprite, text: string): T.Lit {
  const pix = new Pixmap(sp.pix.w, sp.pix.h); pix.data.set(sp.pix.data);
  const night = new Pixmap(sp.pix.w, sp.pix.h); if (sp.night) night.data.set(sp.night.data);
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
function decoratePlaza(pm: Pixmap, nt: Pixmap, cx: number, cy: number): void {
  const { rx, ry } = RING;
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
