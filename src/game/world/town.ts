// Planta da cidade inicial: terrenos, prédios, objetos, colisão e portas.
// Tudo em coordenadas de bloco (16 px). A arte sai de ground/props/buildings.
import * as B from './buildings';
import { TILE, type Building } from './buildings';
import { paintGround, type Terrain } from './ground';
import { hash, hex, Pixmap } from './pixmap';
import { PAVE } from './palette';
import * as P from './props';
import { houseHG } from './house-hg';
import { arenaHG, cardCenterHG, guildHallHG, shopHG } from './buildings-hg';

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
}

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
  const building = (b: Building, tx: number, ty: number) => {
    objects.push({ id: b.id, pix: b.pix, x: tx * TILE, y: ty * TILE - b.extraTop, baseY: (ty + b.tilesH) * TILE, frames: b.frames, frameMs: b.frames ? 450 : undefined });
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
  building(B.tower(), 17, 4);
  block(17, 2, 6, 2); // a arte da Torre sobe até aqui: ninguém anda por trás dela
  building(cardCenterHG(), 4, 10);
  building(shopHG(), 30, 10);
  building(arenaHG(), 27, 21);
  building(guildHallHG(), 4, 21);
  building(houseHG('sua-casa', 'Sua Casa', { roof: 'vermelho', wood: 'bege' }), 3, 2);
  building(houseHG('casa-azul', 'Casa', { roof: 'azul', wood: 'branco', door: '#4a78c8' }), 9, 2);
  building(houseHG('casa-rosa', 'Casa', { roof: 'roxo', wood: 'rosa', tilesW: 6, door: '#b0608a' }), 26, 2);
  building(houseHG('casa-verde', 'Casa', { roof: 'verde', wood: 'bege', door: '#5a9a4a' }), 33, 2);
  building(houseHG('casa-roxa', 'Casa', { roof: 'roxo', wood: 'branco', door: '#7e60c0' }), 14, 21);
  building(houseHG('casa-laranja', 'Casa', { roof: 'laranja', wood: 'bege', door: '#d07040' }), 21, 21);

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
  put('fonte', [0, 1, 2].map(f => P.fountain(f)), 18, 13, 4, 2, true, 180);
  put('mural', P.noticeBoard(), 14, 12, 3, 1);
  put('banco-1', P.bench(), 14, 15, 2, 1);
  put('banco-2', P.bench(), 24, 15, 2, 1);
  put('totem-1', [0, 1, 2, 3, 4].map(f => P.holoTotem(f)), 13, 18, 1, 1, true, 160);
  put('totem-2', [2, 3, 4, 0, 1].map(f => P.holoTotem(f)), 26, 18, 1, 1, true, 160);
  for (const [tx, ty] of [[16, 11], [23, 11], [16, 18], [23, 18], [3, 15], [9, 15], [29, 15], [36, 15]]) {
    put(`poste-${tx}-${ty}`, [0, 1].map(f => P.lamp(f)), tx, ty, 1, 1, true, 900);
  }
  put('maquina', P.vending(), 35, 14, 1, 1);
  for (const [tx, ty, c] of [[13, 15, '#b07cff'], [26, 15, '#40e4ff']] as [number, number, string][]) {
    put(`vaso-${tx}-${ty}`, P.planter(hex(c)), tx, ty, 1, 1);
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
  put('vaso-lago-1', P.planter(hex('#ff5a9a')), 31, 20, 1, 1);
  put('vaso-lago-2', P.planter(hex('#ffe066')), 34, 20, 1, 1);
  // portal de boas-vindas na saída sul
  const arch = P.welcomeArch('CIDADE WIT', B.drawText, B.textWidth);
  objects.push({ id: 'portal', pix: arch, x: 18 * TILE, y: 28 * TILE - arch.h, baseY: 28 * TILE });
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
  decoratePlaza(ground);
  objects.sort((a, b) => a.baseY - b.baseY);
  return { ground, objects, solid, doors, spawn: { tx: 20, ty: 12 }, terrain };
}

/** Mosaico em anel com luz em volta da fonte da praça. */
function decoratePlaza(pm: Pixmap): void {
  const cx = 20 * TILE, cy = 14 * TILE + 12, rx = 58, ry = 34;
  for (let y = cy - ry - 6; y <= cy + ry + 6; y++) for (let x = cx - rx - 6; x <= cx + rx + 6; x++) {
    const d = Math.sqrt(((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2);
    if (d > 1.08 || d < 0.9) continue;
    const band = d > 1.03 || d < 0.95;
    pm.put(x, y, band ? PAVE.accentDark : (((x >> 2) + (y >> 2)) & 1 ? PAVE.accent : PAVE.glowSoft));
  }
  // raios de luz até as saídas da praça
  for (let y = cy + ry + 6; y < 19 * TILE; y += 2) { pm.put(cx - 1, y, PAVE.glow); pm.put(cx, y, PAVE.glow); }
}

/** Desenha a cidade inteira numa imagem (para revisão e miniaturas). */
export function renderTown(town: Town, extra: Placed[] = []): Pixmap {
  const out = new Pixmap(town.ground.w, town.ground.h);
  out.blit(town.ground, 0, 0);
  const all = [...town.objects, ...extra].sort((a, b) => a.baseY - b.baseY);
  for (const o of all) out.blit(o.pix, o.x, o.y);
  return out;
}
