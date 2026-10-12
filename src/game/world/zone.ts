// Kit para montar uma área do mundo (cidade, lago, fazenda, Cidade WIT): a
// planta (terrenos, colisão), prédios, árvores, objetos, postes, portas e
// saídas pelas bordas, e no fim o chão pintado e as luzes da noite. Cada área
// é um `Town` (o mesmo formato que o jogo desenha); o mundo é o conjunto delas
// ligadas pelas bordas (plano §3.7).
import { TILE, type Building } from './buildings';
import { groundKey, paintGround, paintGroundHd, type GroundTextures, type Terrain } from './ground';
import { hash, hex, Pixmap } from './pixmap';
import { LED, WIT } from './palette';
import * as P from './props';
import * as T from './props-tech';
import { swayFrames } from './motion';
import { findPlaque, lampNight, padTo, type Sprite, type WorldAssets } from './assets';
import { drawText, textWidth } from './font';
import type { Dir } from './movement';

export type ZoneId = 'cidade' | 'lago' | 'fazenda' | 'wit';

export const ZONE_NAMES: Record<ZoneId, string> = {
  cidade: 'Centro',
  lago: 'Lago Azul',
  fazenda: 'Fazenda do Vale',
  wit: 'Cidade WIT',
};

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

/**
 * Saída pela borda: pisar num bloco do retângulo leva para a área `to`,
 * no bloco `at` (o deslocamento dentro da saída é mantido no eixo `keep`).
 */
export interface Exit {
  x0: number; y0: number; x1: number; y1: number;
  to: ZoneId;
  at: { tx: number; ty: number };
  keep: 'x' | 'y';
  /** Para onde o boneco olha ao chegar. */
  dir: Dir;
}

/** Algo no mapa com que se interage de frente (pescar, embarcar, plantar...). */
export interface Spot {
  kind: string;
  tx: number;
  ty: number;
  /** Dados livres de cada tipo (ex.: para onde o barco vai). */
  data?: Record<string, unknown>;
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
  /** Água onde um peixe pula de vez em quando. */
  splashes?: { x0: number; y0: number; x1: number; y1: number }[];
}

export interface Lamp {
  /** Lâmpada e centro da poça no chão, em pixels do mundo. */
  bulb: [number, number];
  ground: [number, number];
  /** Camada acesa do poste (a cúpula) e onde ela vai. */
  night?: Pixmap;
  x: number;
  y: number;
  /** 0–1: espalha a hora de acender entre os postes. */
  seed: number;
  /** Poste inteligente (IoT): à noite fica fraquinho e acende forte quando alguém chega perto. */
  smart?: boolean;
}

export interface GlowSpot { x: number; y: number; r: number; color: readonly [number, number, number]; k: number }

export interface Town {
  id: ZoneId;
  name: string;
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
  /** Pixels de cada circuito da calçada (pulsos à noite). */
  circuits: [number, number][][];
  /** Poças de luz fixas (prédios), somadas à noite. */
  glowSpots: GlowSpot[];
  /** Postes: cada um acende e apaga na sua hora (desenhados à parte, não entram em `lights`). */
  lamps: Lamp[];
  /** Onde acontecem os efeitos de ambiente (fumaça, brilhos, borboletas…), em pixels do mundo. */
  fx: Ambient;
  /** Saídas pelas bordas para as outras áreas. */
  exits: Exit[];
  /** Coisas com que se interage (pescar, barco, campo de plantar...). */
  spots: Spot[];
  /** Água onde a animação de ondas é desenhada na hora (lagos grandes), em blocos. */
  waterAnim?: { x0: number; y0: number; x1: number; y1: number };
  /** Telões: a tela (em pixels do mundo) onde o jogo escreve o Jornal WIT. */
  screens?: { x: number; y: number; w: number; h: number; baseY: number }[];
  /** A telinha em cima da porta da Torre (o andar do aluno), em pixels do mundo. */
  towerScreen?: { x: number; y: number; w: number; h: number; baseY: number };
}

export interface ZoneOptions {
  /** Chão hd já pintado (scripts/mapa/chao-pronto.ts); só vale se a chave bater com a planta. */
  groundHd?: Pixmap;
  groundKey?: string;
}

/**
 * Onde fica o meio da porta em cada sprite (px a partir da esquerda), medido
 * nas imagens; os que não estão aqui têm a porta no meio da arte.
 */
export const DOOR_X: Record<string, number> = {
  'casa-azul': 36, 'casa-chale': 37, 'casa-laranja': 36.5, 'casa-roxa': 36.5, 'casa-verde': 37,
  'casa-vermelha-antena': 36.5, 'casa-padaria': 48, 'casa-moderna': 47, 'casa-floricultura': 34.5,
  'casa-rosa': 36, torre: 57.7, oficina: 55.5,
};

/** Sprites que têm chaminé (os outros têm antena, bandeira ou nada no telhado). */
export const CHIMNEY = new Set(['casa-azul', 'casa-chale', 'casa-laranja', 'casa-roxa', 'casa-verde', 'casa-vermelha-antena', 'casa-tijolo',
  'casa-rosa', 'casa-padaria', 'casa-pescador', 'casa-musico', 'casa-bibliotecaria', 'casa-artista', 'casa-inventor',
  'casa-montanha', 'casa-floricultura']);

const TREE_SPRITE: Record<P.TreeKind, string> = { pinheiro: 'pinheiro', redonda: 'arvore-redonda', florida: 'cerejeira', arbusto: 'arbusto' };
/** Enfeites de chão que balançam com o vento. */
const SWAYS = new Set(['tulipas', 'mato', 'arbusto-florido']);

/** A planta de uma área em construção. Os métodos repetem o que a cidade sempre fez. */
export class ZoneBuilder {
  readonly terrain: Terrain[][];
  readonly solid: boolean[][];
  readonly objects: Placed[] = [];
  readonly doors: Door[] = [];
  readonly exits: Exit[] = [];
  readonly spots: Spot[] = [];
  readonly buildingGlow: GlowSpot[] = [];
  readonly lamps: Lamp[] = [];
  readonly fx: Ambient = { chimneys: [], glints: [], flowers: [], blossoms: [], leaves: [], beacons: [], fireflies: [] };
  readonly groundTex?: GroundTextures;
  private flipCache = new Map<Sprite, Sprite>();
  private lampArt?: { pix: Pixmap; night?: Pixmap; src?: Sprite };

  constructor(readonly A: WorldAssets, readonly w: number, readonly h: number, base: Terrain = 'grama') {
    this.terrain = Array.from({ length: h }, () => Array<Terrain>(w).fill(base));
    this.solid = Array.from({ length: h }, () => Array<boolean>(w).fill(false));
    this.groundTex = A['chao-grama'] && A['chao-areia'] && A['chao-calcada'] && A['chao-agua']
      && A['chao-mato'] && A['chao-flores'] && A['chao-floresta']
      ? {
        grama: A['chao-grama'].pix, areia: A['chao-areia'].pix, calcada: A['chao-calcada'].pix, agua: A['chao-agua'].pix,
        mato: A['chao-mato'].pix, flores: A['chao-flores'].pix, floresta: A['chao-floresta'].pix,
      }
      : undefined;
  }

  inside(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  fill(t: Terrain, x0: number, y0: number, w: number, h: number): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (this.inside(x, y)) this.terrain[y][x] = t;
  }

  /** Preenche um desenho ('#' = terreno) a partir de (x0, y0): formas soltas, não retângulos. */
  shape(t: Terrain, x0: number, y0: number, rows: string[]): void {
    rows.forEach((r, dy) => [...r].forEach((c, dx) => { if (c === '#') this.fill(t, x0 + dx, y0 + dy, 1, 1); }));
  }

  /** Mancha orgânica (lago, clareira): elipse com borda ondulada pelo ruído. */
  blob(t: Terrain, cx: number, cy: number, rx: number, ry: number, seed = 1, wobble = 0.22): void {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const a = Math.atan2(y - cy, x - cx);
      const k = 1 + wobble * (Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 5 + seed * 2.3) * 0.3 + (hash(Math.round(a * 8), seed, 9) - 0.5) * 0.4);
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d <= k) this.fill(t, x, y, 1, 1);
    }
  }

  block(x0: number, y0: number, w: number, h: number): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (this.inside(x, y)) this.solid[y][x] = true;
  }

  free(x0: number, y0: number, w: number, h: number): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (this.inside(x, y)) this.solid[y][x] = false;
  }

  /** Objeto cuja base ocupa (tx..tx+tw-1, ty..ty+th-1); a arte encosta embaixo. */
  put(id: string, pix: Pixmap | Pixmap[], tx: number, ty: number, tw: number, th: number, isSolid = true, frameMs = 500): Placed {
    const frames = Array.isArray(pix) ? pix : undefined;
    const first = frames ? frames[0] : (pix as Pixmap);
    const x = tx * TILE + ((tw * TILE - first.w) >> 1);
    const y = (ty + th) * TILE - first.h;
    const o: Placed = { id, pix: first, x, y, baseY: (ty + th) * TILE, frames, frameMs: frames ? frameMs : undefined };
    this.objects.push(o);
    if (isSolid) this.block(tx, ty, tw, th);
    return o;
  }

  /** Objeto com camada de noite (um ou vários quadros). */
  putLit(id: string, lit: T.Lit | T.Lit[], tx: number, ty: number, tw: number, th: number, isSolid = true, frameMs = 500): Placed {
    const list = Array.isArray(lit) ? lit : [lit];
    const o = this.put(id, list.length > 1 ? list.map(l => l.pix) : list[0].pix, tx, ty, tw, th, isSolid, frameMs);
    if (list.length > 1) { o.nightFrames = list.map(l => l.night ?? new Pixmap(l.pix.w, l.pix.h)); o.night = o.nightFrames[0]; }
    else o.night = list[0].night;
    return o;
  }

  /** Prédio (arte já pronta): colisão no retângulo, portas na última fileira, janelas, chaminé e luz. */
  building(b: Building, tx: number, ty: number): Placed {
    for (const gl of b.glow ?? []) this.buildingGlow.push({ ...gl, x: tx * TILE + gl.x, y: ty * TILE - b.extraTop + gl.y });
    const ox = tx * TILE + (b.offsetX ?? 0), oy = ty * TILE - b.extraTop;
    if (b.chimney) this.fx.chimneys.push([ox + b.chimney.x, oy + b.chimney.y]);
    // janelas: pontos acesos da camada da noite, um a cada 10 px no máximo
    if (b.night) {
      const seen = new Set<string>();
      for (let y = 0; y < b.night.h; y++) for (let x = 0; x < b.night.w; x++) {
        if (b.night.data[(y * b.night.w + x) * 4 + 3] === 0) continue;
        const key = `${(x / 10) | 0},${(y / 10) | 0}`;
        if (seen.has(key)) continue;
        seen.add(key);
        this.fx.glints.push([ox + x, oy + y]);
      }
    }
    const o: Placed = {
      id: b.id, pix: b.pix, x: tx * TILE + (b.offsetX ?? 0), y: ty * TILE - b.extraTop, baseY: (ty + b.tilesH) * TILE,
      frames: b.frames, frameMs: b.frames ? 450 : undefined, night: b.night, nightFrames: b.nightFrames,
    };
    this.objects.push(o);
    this.block(tx, ty, b.tilesW, b.tilesH);
    for (const c of b.doorCols) {
      const d = { tx: tx + c, ty: ty + b.tilesH - 1, building: b.id, name: b.name };
      this.solid[d.ty][d.tx] = false;
      this.doors.push(d);
    }
    return o;
  }

  /** Prédio a partir de um sprite (arte centrada embaixo do retângulo), ou a versão por código. */
  sprB(name: string, id: string, title: string, tw: number, th: number, doorCols: number[], fallback: () => Building): Building {
    const sp = this.A[name];
    if (!sp) return fallback();
    const W = tw * TILE, H = Math.max(sp.pix.h, th * TILE);
    const pix = padTo(sp.pix, W, H);
    // a porta desenhada fica no meio do(s) bloco(s) de porta
    const left = (pix.w - sp.pix.w) >> 1;
    // sem porta (silo, telão): a arte fica centrada
    const want = doorCols.length ? ((doorCols[0] + doorCols[doorCols.length - 1] + 1) / 2) * TILE : W / 2;
    const offsetX = Math.round(want - (left + (DOOR_X[name] ?? sp.pix.w / 2)));
    const ch = CHIMNEY.has(name) ? chimneyTop(sp.pix) : undefined;
    const chimney = ch ? { x: left + ch.x, y: pix.h - sp.pix.h + ch.y } : undefined;
    return { id, name: title, pix, night: sp.night ? padTo(sp.night, W, H) : undefined, tilesW: tw, tilesH: th, extraTop: pix.h - th * TILE, doorCols, offsetX, chimney };
  }

  /** Objeto a partir de um sprite, ou a versão por código. */
  sprLit(name: string, fallback: () => T.Lit): T.Lit {
    const sp = this.A[name];
    return sp ? { pix: sp.pix, night: sp.night } : fallback();
  }

  flipped(sp: Sprite): Sprite {
    const hit = this.flipCache.get(sp);
    if (hit) return hit;
    const f1 = (pm: Pixmap) => { const o = new Pixmap(pm.w, pm.h); o.blit(pm, 0, 0, true); return o; };
    const f = (pm: Pixmap) => { const o = f1(pm); if (pm.hd) o.hd = f1(pm.hd); return o; };
    const r = { pix: f(sp.pix), night: sp.night ? f(sp.night) : undefined };
    this.flipCache.set(sp, r);
    return r;
  }

  treePix(kind: P.TreeKind, seed: number): { pix: Pixmap; night?: Pixmap } {
    const sp = this.A[TREE_SPRITE[kind]];
    if (!sp) return { pix: P.tree(kind, seed) };
    return hash(seed, 1, 77) < 0.5 ? this.flipped(sp) : sp;   // espelha metade, para a mata não parecer carimbo
  }

  /** Árvore (2 × 2 blocos; arbusto 1 × 1) balançando com o vento. */
  tree(kind: P.TreeKind, tx: number, ty: number, seed: number): Placed {
    const t = this.treePix(kind, seed);
    const small = kind === 'arbusto';
    // o vento passa como uma onda (fase pela posição)
    const frames = t.pix.hd ? swayFrames(t.pix, small ? 1 : 2, small ? 1 : 0.72) : undefined;
    const o = this.put(`arvore-${tx}-${ty}`, frames ?? t.pix, tx, ty, small ? 1 : 2, small ? 1 : 2, true, 240);
    o.night = t.night;
    if (kind === 'florida') this.fx.blossoms.push([o.x + o.pix.w / 2, o.y + o.pix.h * 0.35]);
    if (kind === 'redonda') this.fx.leaves.push([o.x + o.pix.w / 2, o.y + o.pix.h * 0.35]);
    if (frames) o.phase = Math.floor(tx * 0.6 + ty * 0.25 + hash(tx, ty, 3) * 1.5);
    return o;
  }

  /** Pinheiro de fundo (atrás de tudo, fora do mapa ou na borda), sem colisão. */
  behind(tx: number, ty: number, seed: number): void {
    const { pix } = this.treePix('pinheiro', seed);
    this.objects.push({ id: `mata-${tx}-${ty}`, pix, x: tx * TILE, y: (ty + 2) * TILE - pix.h, baseY: (ty + 2) * TILE - 1000 });
  }

  /**
   * Mata fechada na borda da área (pinheiros em duas camadas), com as
   * aberturas dadas (em blocos da borda) para as saídas.
   */
  forestEdge(open: { side: 'n' | 's' | 'w' | 'e'; from: number; to: number }[] = []): void {
    const W = this.w, H = this.h;
    const gap = (side: 'n' | 's' | 'w' | 'e', v: number) => open.some(o => o.side === side && v >= o.from && v <= o.to);
    const gap2 = (side: 'n' | 's' | 'w' | 'e', v: number) => gap(side, v) || gap(side, v + 1);
    for (let tx = -1; tx < W; tx += 2) { if (!gap2('n', tx)) this.behind(tx, -1, tx + 40); if (!gap2('s', tx)) this.behind(tx, H - 1, tx + 60); }
    for (let ty = 1; ty < H; ty += 2) { if (!gap2('w', ty)) this.behind(-1, ty, ty + 80); if (!gap2('e', ty)) this.behind(W - 1, ty, ty + 90); }
    for (let tx = 0; tx < W; tx += 2) {
      if (!gap2('n', tx)) { this.tree('pinheiro', tx, 0, tx); this.fill('floresta', tx, 0, 2, 2); this.block(tx, 0, 2, 2); }
      if (!gap2('s', tx)) { this.tree('pinheiro', tx, H - 2, tx + 1); this.fill('floresta', tx, H - 2, 2, 2); this.block(tx, H - 2, 2, 2); }
    }
    for (let ty = 2; ty < H - 2; ty += 2) {
      if (!gap2('w', ty)) { this.tree('pinheiro', 0, ty, ty + 3); this.fill('floresta', 0, ty, 2, 2); this.block(0, ty, 2, 2); }
      if (!gap2('e', ty)) { this.tree('pinheiro', W - 2, ty, ty + 5); this.fill('floresta', W - 2, ty, 2, 2); this.block(W - 2, ty, 2, 2); }
    }
  }

  /** Poste (acende sozinho na sua hora, desenhado à parte pelo jogo). */
  lamp(tx: number, ty: number, smart = false): void {
    // poste inteligente da Cidade WIT: a arte própria do GPT quando houver
    const sp = (smart && this.A['poste-inteligente']) || this.A.poste;
    if (!this.lampArt || this.lampArt.src !== sp) this.lampArt = sp ? { pix: sp.pix, night: lampNight(sp, 9), src: sp } : { ...T.lampLit(), src: undefined };
    const o = this.putLit(`poste-${tx}-${ty}`, { pix: this.lampArt.pix }, tx, ty, 1, 1);
    const i = this.lamps.length;
    this.lamps.push({ bulb: [tx * TILE + 8, ty * TILE - 9], ground: [tx * TILE + 8, ty * TILE + 10], night: this.lampArt.night, x: o.x, y: o.y, seed: (i * 0.618034) % 1, smart });
  }

  /** Enfeite de chão (dá para pisar); flor, mato e arbusto florido balançam com o vento. */
  decor(id: string, name: string, tx: number, ty: number): void {
    const sp = this.A[name];
    if (!sp) return;
    if (name === 'tulipas' || name === 'arbusto-florido') this.fx.flowers.push([tx * TILE + 8, ty * TILE + 6]);
    if (SWAYS.has(name) && sp.pix.hd) {
      const o = this.put(id, swayFrames(sp.pix, 1, 1, 8), tx, ty, 1, 1, false, 200);
      o.phase = Math.floor(tx * 0.6 + ty * 0.25 + hash(tx, ty, 5) * 2);
    } else this.putLit(id, { pix: sp.pix, night: sp.night }, tx, ty, 1, 1, false);
  }

  /**
   * Espalha flores, cogumelos, pedrinhas e mato pelo gramado livre (longe de
   * caminho, porta e objeto). `chance` por bloco.
   */
  scatter(chance = 0.07, kinds = ['tulipas', 'tulipas', 'arbusto-florido', 'tulipas', 'cogumelos', 'pedrinhas', 'mato'], salt = 131, skip?: (tx: number, ty: number) => boolean): void {
    if (!this.A.tulipas) return;
    const taken = new Set(this.objects.map(o => `${Math.floor((o.x + o.pix.w / 2) / TILE)},${Math.floor(o.baseY / TILE) - 1}`));
    const nearRoad = (tx: number, ty: number) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const t = this.terrain[ty + dy]?.[tx + dx];
        if (t && t !== 'grama') return true;
      }
      return false;
    };
    for (let ty = 3; ty < this.h - 3; ty++) for (let tx = 3; tx < this.w - 3; tx++) {
      if (this.terrain[ty][tx] !== 'grama' || this.solid[ty][tx] || this.solid[ty + 1]?.[tx] || nearRoad(tx, ty) || taken.has(`${tx},${ty}`) || skip?.(tx, ty)) continue;
      if (hash(tx, ty, salt) > chance) continue;
      const name = kinds[Math.floor(hash(ty, tx, 7) * kinds.length)];
      if (!this.A[name]) continue;
      this.decor(`enfeite-${tx}-${ty}`, name, tx, ty);
    }
  }

  /** Saída pela borda. */
  exit(e: Exit): void { this.exits.push(e); }

  /** Poça de luz fixa à noite (fogueira, vitrine), em pixels do mundo. */
  glowSpot(x: number, y: number, r: number, color: readonly [number, number, number], k: number): void {
    this.buildingGlow.push({ x, y, r, color, k });
  }

  spot(kind: string, tx: number, ty: number, data?: Record<string, unknown>): void { this.spots.push({ kind, tx, ty, data }); }

  /** Água bloqueia (quem anda de barco usa a regra ao contrário). */
  waterBlocks(): void {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.terrain[y][x] === 'agua') this.solid[y][x] = true;
  }

  /**
   * Chão pintado (o pronto, se a chave bater; senão calcula), em 1× com a hd
   * junto. Devolve também a camada de luzes do chão (vazia).
   */
  paintGround(opts: ZoneOptions, readyDir = 'cidade'): { ground: Pixmap; groundNight: Pixmap } {
    const W = this.w, H = this.h;
    const ready = opts.groundHd && opts.groundKey === groundKey(this.terrain) && opts.groundHd.w === W * TILE * 2 ? opts.groundHd : undefined;
    if (opts.groundHd && !ready) console.warn(`chão pronto de "${readyDir}" desatualizado: rode npx vite-node scripts/mapa/chao-pronto.ts`);
    const groundBig = ready ? copyOf(ready) : this.groundTex ? paintGroundHd(this.terrain, this.groundTex) : undefined;
    const ground = groundBig ? halve(groundBig) : paintGround(this.terrain, this.groundTex);
    if (groundBig) ground.hd = groundBig;
    const groundNight = new Pixmap(ground.w, ground.h);
    if (ground.hd) groundNight.hd = new Pixmap(ground.hd.w, ground.hd.h);
    return { ground, groundNight };
  }

  /** Borboletas nos canteiros e vaga-lumes no mato alto e na beira da mata. */
  natureFx(): void {
    for (let ty = 0; ty < this.h; ty++) for (let tx = 0; tx < this.w; tx++) {
      const t = this.terrain[ty][tx];
      if (t === 'flores' && hash(tx, ty, 17) < 0.35) this.fx.flowers.push([tx * TILE + 8, ty * TILE + 6]);
      if (t === 'mato' && hash(tx, ty, 18) < 0.5) this.fx.fireflies.push({ x0: tx * TILE, y0: ty * TILE - 8, x1: tx * TILE + 16, y1: ty * TILE + 12 });
    }
  }

  /** Fecha a área: ordena os objetos e junta as luzes. */
  finish(id: ZoneId, ground: Pixmap, groundNight: Pixmap, spawn: { tx: number; ty: number }, extra: Partial<Town> = {}): Town {
    this.objects.sort((a, b) => a.baseY - b.baseY);
    return {
      id, name: ZONE_NAMES[id],
      fx: this.fx, ground, objects: this.objects, solid: this.solid, doors: this.doors, spawn, terrain: this.terrain,
      lights: composeLights(groundNight, this.objects.filter(o => !o.frames)),
      groundNight,
      circuits: [],
      glowSpots: this.buildingGlow,
      lamps: this.lamps,
      exits: this.exits,
      spots: this.spots,
      ...extra,
    };
  }
}

/** O pixel mais alto da arte (ponta de antena), em pixels do mundo, para um objeto já posto. */
export function topPixel(o: Placed): [number, number] | undefined {
  const src = o.pix;
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.data[(y * src.w + x) * 4 + 3] > 200) return [o.x + x + 0.5, o.y + y + 1];
  return undefined;
}

/** Topo da chaminé: o primeiro trecho cinza (pedra) no alto da arte, em px da arte normal. */
export function chimneyTop(pm: Pixmap): { x: number; y: number } | undefined {
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

/**
 * Junta as luzes do chão com as dos objetos, na ordem de desenho: um objeto
 * na frente apaga a luz que estiver atrás dele (a árvore tapa a janela).
 */
export function composeLights(groundNight: Pixmap, objs: Placed[]): Pixmap {
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
export function labeled(sp: Sprite, text: string): T.Lit {
  const one = labelOne(sp.pix, sp.night, text);
  // hd: o texto é escrito de novo na placa da arte grande, com letra fina (1 px da fonte = 1 px hd)
  if (sp.pix.hd) {
    const big = labelOne(sp.pix.hd, sp.night?.hd, text);
    one.pix.hd = big.pix;
    one.night!.hd = big.night;
  }
  return one;
}

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
  drawText(night, t, x, y, { fill: [255, 255, 255], fillBottom: LED.greenSoft, shadow: WIT.deep });
  return { pix, night };
}

/** Reduz uma imagem pela metade (média de cada 2 × 2). */
export function halve(pm: Pixmap): Pixmap {
  const out = new Pixmap(pm.w >> 1, pm.h >> 1), s = pm.data, d = out.data, W = pm.w;
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    const i = (y * 2 * W + x * 2) * 4, j = i + W * 4, o = (y * out.w + x) * 4;
    for (let c = 0; c < 4; c++) d[o + c] = (s[i + c] + s[i + 4 + c] + s[j + c] + s[j + 4 + c] + 2) >> 2;
  }
  return out;
}

/** Arte feita direto em hd: a normal é ela reduzida, e leva a hd junto. */
export function withHd(hd: Pixmap): Pixmap {
  const one = halve(hd);
  one.hd = hd;
  return one;
}

export function copyOf(pm: Pixmap): Pixmap {
  const o = new Pixmap(pm.w, pm.h);
  o.data.set(pm.data);
  return o;
}

/**
 * Quadros da água de um lago pequeno: cada pixel de água (azul) do chão hd
 * pega a textura de água deslocada num vaivém lento, mantendo o claro/escuro
 * que tinha (espuma da borda, sombra da margem), e ganha brilhinhos que correm.
 * A arte normal (1×) fica vazia: a água só se mexe em hd. (Lagos grandes usam
 * a animação desenhada na hora, `Town.waterAnim`, que não gasta memória.)
 */
export function lakeFrames(groundHd: Pixmap, tex: Pixmap, box: { x0: number; y0: number; x1: number; y1: number }, n = 12): Pixmap[] {
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

/** Píer de tábuas (hd) de `tiles` blocos de comprido, saindo da margem para a esquerda. */
export function pierArt(tiles = 2): Pixmap {
  const W = Math.round(tiles * 15) * 2, H = 18 * 2, hd = new Pixmap(W, H);
  const plank = hex('#b88a52'), light = hex('#d8ac6e'), dark = hex('#7a5430'), gap = hex('#5a3c22'), post = hex('#6a4626');
  // postes na água
  for (let px = 4; px < W - 2; px += 22) { hd.rect(px, 22, 5, 12, post); hd.rect(px, 32, 5, 2, hex('#2e6aa8')); }
  for (let x = 0; x < W; x++) for (let y = 4; y < 24; y++) {
    const col = x % 8;
    const c = col === 7 ? gap : y === 4 || y === 5 ? light : y >= 21 ? dark : col === 0 ? light : plank;
    hd.put(x, y, c);
  }
  for (let x = 3; x < W; x += 8) { hd.put(x, 7, dark); hd.put(x, 19, dark); hd.put(x + 2, 12, hex('#a07444')); hd.put(x + 1, 15, hex('#a07444')); }
  hd.rect(0, 3, W, 1, dark);
  for (let x = 0; x < W; x++) { hd.put(x, 24, hex('#2e5e96')); hd.put(x, 25, hex('#3a74b0')); }
  return withHd(hd);
}

/** Taboas (capim de beira d'água com a espiga marrom), hd. */
export function reedArt(seed: number): Pixmap {
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
