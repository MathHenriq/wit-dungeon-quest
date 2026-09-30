// Lago Azul (leste do Centro): um lago enorme com praia, a ilha do farol,
// a vila dos pescadores (Casa de Pesca, loja de iscas, casinhas), píeres
// para pescar, o cais do barquinho, um riacho com ponte e o acampamento.
// Tudo em blocos de 16 px; a arte nova sai de buildings-lago.ts e houses-hd.ts.
import { TILE } from './buildings';
import type { WorldAssets } from './assets';
import * as P from './props';
import { swayFrames } from './motion';
import { hash, hex, type Pixmap } from './pixmap';
import {
  barrel, bridgeArt, campfireFrames, crates, dockArt, fishHouse, fishRack, fishStall, lighthouse, lilyPads, ringPost,
  sandcastle, shoreRocks, tent, umbrella,
} from './buildings-lago';
import { cottage } from './houses-hd';
import { reedArt, ZoneBuilder, type Town, type ZoneOptions } from './zone';

export const LAGO_W = 72;
export const LAGO_H = 48;
/** Entrada pelo oeste (vindo do Centro). */
export const LAGO_WEST = { y0: 20, y1: 21 };
/** O lago (centro e raios, em blocos). */
export const LAKE = { cx: 45, cy: 24, rx: 19, ry: 15 };
export const ISLAND = { cx: 51, cy: 22 };
/** Onde o riacho desce do norte. */
const CREEK = 31;

export function buildLago(assets?: WorldAssets, opts: ZoneOptions = {}): Town {
  const A: WorldAssets = assets ?? {};
  const z = new ZoneBuilder(A, LAGO_W, LAGO_H);
  const { terrain, solid } = z;
  const sprite = (name: string, fallback: () => { pix: Pixmap; night?: Pixmap }) => z.sprLit(name, fallback);

  // ── terreno: praia, lago com uma baía e uma enseada, ilha, riacho, caminhos ──
  z.blob('trilha', LAKE.cx - 3, LAKE.cy + 3, LAKE.rx + 3, LAKE.ry + 1, 5, 0.14);     // praia (larga a oeste e ao sul)
  z.blob('agua', LAKE.cx, LAKE.cy, LAKE.rx, LAKE.ry, 3, 0.2);
  z.blob('agua', LAKE.cx + 11, LAKE.cy - 11, 7, 4.5, 11, 0.25);                        // baía do nordeste
  z.blob('agua', LAKE.cx - 12, LAKE.cy + 11, 5, 3.5, 13, 0.25);                        // enseada do sudoeste
  z.blob('trilha', ISLAND.cx, ISLAND.cy, 5.6, 4.4, 7, 0.2);                            // ilha: areia em volta
  z.blob('grama', ISLAND.cx, ISLAND.cy - 0.5, 4, 3, 8, 0.2);
  z.fill('trilha', 0, LAGO_WEST.y0, 10, 2);                                           // estrada que vem do Centro
  z.blob('trilha', 13, 20, 11, 5, 2, 0.12);                                          // praça de areia da vila
  z.fill('trilha', 20, 8, 22, 2);                                                     // trilha do norte (até o píer)
  z.fill('trilha', 22, 10, 2, 7);
  z.fill('trilha', 3, 32, 20, 2);                                                     // ruazinha das casas do sul
  z.fill('trilha', 12, 25, 2, 7);
  for (let y = 0; y < 12; y++) z.fill('agua', CREEK + Math.round(Math.sin(y * 0.55) * 1.2), y, 2, 1);   // riacho (corta a trilha: a ponte passa por cima)
  z.shape('mato', 2, 38, ['.####..', '#######', '######.', '.###...']);
  z.shape('mato', 60, 42, ['..####', '######', '.####.']);
  z.shape('mato', 64, 4, ['.###', '####', '###.']);
  z.shape('flores', 26, 3, ['.###.', '#####', '.###.']);
  z.shape('flores', 2, 25, ['###', '###']);

  // ── mata na borda, aberta a oeste (estrada) e ao norte (riacho) ──
  z.forestEdge([{ side: 'w', from: LAGO_WEST.y0, to: LAGO_WEST.y1 }, { side: 'n', from: CREEK - 1, to: CREEK + 2 }]);

  // ── vila dos pescadores: rua de cima ──
  z.building(fishHouse(), 3, 11);
  const bait = cottage('loja-iscas', 'Loja de Iscas', {
    wall: hex('#e8d8b8'), wallKind: 'plaster', roof: hex('#c8563a'), shutters: hex('#3a78a8'), trim: hex('#8a5a34'),
    sign: { text: 'ISCAS', bg: hex('#3a78a8') }, awning: [hex('#3a78a8'), hex('#f4f0e8')], chimney: false, seed: 2,
  });
  z.building(bait, 11, 12);
  z.fill('trilha', 13, 15, 1, 1);
  z.building(cottage('casa-nando', 'Casa do Nando', { wall: hex('#8ab0c8'), roof: hex('#4a5a8a'), shutters: hex('#e8e0d0'), seed: 3 }), 17, 12);
  z.fill('trilha', 19, 15, 1, 1);

  // ── praça: banca, caixotes, barris, varal de peixe, boias, bancos, postes ──
  z.putLit('banca-peixe', fishStall(), 7, 17, 3, 1);
  for (let k = 0; k < 3; k++) z.spot('banca', 7 + k, 17);
  z.putLit('caixotes', crates(), 11, 18, 2, 1);
  const bar = barrel();
  z.putLit('barril-1', bar, 2, 16, 1, 1);
  z.putLit('barril-2', bar, 3, 17, 1, 1);
  z.putLit('varal-peixe', fishRack(), 15, 17, 2, 1);
  const bench = sprite('banco', () => ({ pix: P.bench() }));
  z.putLit('banco-praca', bench, 16, 23, 2, 1);
  const sign = sprite('placa', () => ({ pix: P.signPost() }));
  z.putLit('placa-entrada', sign, 2, 19, 1, 1);
  z.spot('placa', 2, 19, { lines: ['LAGO AZUL', 'Pesque de qualquer margem ou píer: fique de frente para a água e aperte ESPAÇO.', '← Centro'] });
  z.lamp(5, 19); z.lamp(11, 23); z.lamp(19, 18); z.lamp(22, 23); z.lamp(23, 11); z.lamp(8, 31);

  // ── cais do barquinho: sai da praia na altura da estrada ──
  const dockY = 20;
  let x0 = 0;
  for (let x = 12; x < LAGO_W; x++) if (terrain[dockY][x] === 'agua' && terrain[dockY + 1][x] === 'agua') { x0 = x; break; }
  const dockLen = 6;
  const dock = (tx: number, ty: number, tw: number, th: number, vertical: boolean, id: string) => {
    const pix = dockArt(tw, th, vertical);
    z.objects.push({ id, pix, x: tx * TILE, y: ty * TILE, baseY: ty * TILE - 40 });
    for (let y = ty; y < ty + th; y++) for (let x = tx; x < tx + tw; x++) z.spot('cais', x, y);
  };
  dock(x0 - 1, dockY, dockLen + 1, 2, false, 'cais-principal');
  z.spot('barco', x0 + dockLen, dockY + 1, { dir: 'east' });
  z.putLit('placa-cais', sign, x0 - 2, dockY - 1, 1, 1);
  z.spot('placa', x0 - 2, dockY - 1, { lines: ['CAIS DO BARQUINHO', 'Fique de frente para o barco e aperte ESPAÇO para embarcar.', 'Para descer, encoste numa margem ou num píer e aperte ESPAÇO de frente para a terra.'] });
  z.putLit('boia-1', ringPost(), x0 - 2, dockY + 2, 1, 1);

  // ── píeres de pesca: norte (no fim da trilha), sul, ilha e margem leste ──
  const pierDown = (x: number) => {
    let y = 2;
    while (y < LAGO_H && terrain[y][x] !== 'agua') y++;
    dock(x, y - 1, 1, 5, true, `pier-n-${x}`);
  };
  const pierUp = (x: number) => {
    let y = LAGO_H - 3;
    while (y > 0 && terrain[y][x] !== 'agua') y--;
    dock(x, y - 3, 1, 5, true, `pier-s-${x}`);
  };
  pierDown(41);
  pierUp(40);
  let ix = ISLAND.cx - 3;
  while (ix > 0 && terrain[ISLAND.cy][ix] !== 'agua') ix--;
  dock(ix - 2, ISLAND.cy, 3, 1, false, 'cais-ilha');
  let ex = LAGO_W - 3;
  while (ex > 0 && terrain[31][ex] !== 'agua') ex--;
  dock(ex - 2, 31, 3, 1, false, 'cais-leste');

  // ── ponte da trilha do norte sobre o riacho ──
  {
    let bx0 = LAGO_W, bx1 = 0;
    for (let x = CREEK - 3; x < CREEK + 5; x++) if (terrain[8][x] === 'agua' || terrain[9][x] === 'agua') { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); }
    const pix = bridgeArt(bx1 - bx0 + 3);
    z.objects.push({ id: 'ponte', pix, x: (bx0 - 1) * TILE, y: 8 * TILE - 6, baseY: 8 * TILE - 30 });
    for (let x = bx0; x <= bx1; x++) { z.spot('ponte', x, 8); z.spot('ponte', x, 9); }
  }

  // ── ilha do farol ──
  z.building(lighthouse(), ISLAND.cx - 1, ISLAND.cy - 3);
  z.tree('redonda', ISLAND.cx + 2, ISLAND.cy - 2, 7);
  z.tree('arbusto', ISLAND.cx - 3, ISLAND.cy - 1, 9);
  z.putLit('banco-ilha', bench, ISLAND.cx + 1, ISLAND.cy + 1, 2, 1);

  // ── casas do sul da vila ──
  z.building(cottage('casa-lucia', 'Casa da Lúcia', { wall: hex('#f0e6d0'), roof: hex('#3a8a6a'), shutters: hex('#d8604a'), wallKind: 'plaster', seed: 5 }), 3, 29);
  z.building(cottage('casa-marinho', 'Casa do Marinho', { wall: hex('#c89a6a'), roof: hex('#7a4a8a'), shutters: hex('#f0e8d8'), wallKind: 'logs', seed: 6 }), 14, 29);

  // ── praia: guarda-sóis, toalhas, castelinho de areia ──
  const sand = (tx: number, ty: number) => terrain[ty]?.[tx] === 'trilha' && terrain[ty + 1]?.[tx] === 'trilha' && !solid[ty][tx];
  // (os lugares saem da própria praia: areia com areia do lado, perto da água, longe do cais)
  const umbrellas: [string, string, string][] = [['#e84a5a', '#f8f4ec', '#3a8ad8'], ['#2a9ad8', '#fff0a0', '#e86a8a'], ['#f0a030', '#f8f4ec', '#4ab87a'], ['#8a5ad8', '#f8f4ec', '#f0c040'], ['#3ab87a', '#f8f4ec', '#f07040']];
  const beachSpots: [number, number][] = [];
  for (let ty = 24; ty < LAGO_H - 3; ty++) for (let tx = 18; tx < 60; tx++) {
    if (!sand(tx, ty) || !sand(tx + 1, ty) || !sand(tx, ty - 1) || !sand(tx + 1, ty - 1)) continue;
    let water = false;
    for (let dy = -3; dy <= 3 && !water; dy++) for (let dx = -2; dx <= 3; dx++) if (terrain[ty + dy]?.[tx + dx] === 'agua') { water = true; break; }
    if (!water || beachSpots.some(([x, y]) => Math.abs(x - tx) + Math.abs(y - ty) < 7)) continue;
    if (hash(tx, ty, 97) > 0.5 || solid[ty][tx] || solid[ty][tx + 1]) continue;
    beachSpots.push([tx, ty]);
  }
  beachSpots.slice(0, 7).forEach(([tx, ty], i) => {
    if (i % 3 === 2) { z.putLit(`castelo-areia-${tx}`, sandcastle(), tx, ty, 1, 1); z.spot('castelo-areia', tx, ty); return; }
    const [a, b, t] = umbrellas[i % umbrellas.length];
    z.putLit(`guarda-sol-${tx}`, umbrella(hex(a), hex(b), hex(t)), tx, ty, 2, 1);
  });

  // ── acampamento na margem leste ──
  const camp = { x: ex + 3, y: 34 };
  z.putLit('barraca-1', tent(hex('#e8703a')), camp.x - 1, camp.y - 3, 2, 1);
  z.putLit('barraca-2', tent(hex('#3a9a6a')), camp.x + 2, camp.y + 2, 2, 1);
  z.putLit('fogueira', campfireFrames(), camp.x, camp.y, 1, 1, true, 140);
  z.spot('fogueira', camp.x, camp.y);
  z.glowSpot(camp.x * TILE + 8, camp.y * TILE + 4, 44, [255, 150, 70], 0.5);
  z.putLit('toco-fogueira', sprite('toco', () => ({ pix: P.rock() })), camp.x - 2, camp.y, 1, 1, false);
  z.putLit('banco-mirante', bench, ex + 2, 29, 2, 1);

  // ── árvores e natureza ──
  const groves: [P.TreeKind, number, number][] = [
    ['redonda', 3, 3], ['florida', 11, 3], ['pinheiro', 18, 4], ['redonda', 36, 3], ['pinheiro', 46, 3], ['redonda', 52, 4],
    ['florida', 24, 5], ['redonda', 2, 7], ['pinheiro', 66, 11], ['redonda', 67, 20], ['florida', 66, 26],
    ['redonda', 8, 36], ['pinheiro', 14, 42], ['florida', 20, 43], ['redonda', 26, 44], ['pinheiro', 34, 44],
    ['redonda', 52, 44], ['florida', 58, 40], ['pinheiro', 66, 42], ['redonda', 3, 44], ['florida', 60, 3],
  ];
  groves.forEach(([k, tx, ty], i) => {
    const ok = [0, 1].every(dy => [0, 1].every(dx => !solid[ty + dy]?.[tx + dx] && terrain[ty + dy]?.[tx + dx] !== 'agua' && terrain[ty + dy]?.[tx + dx] !== 'trilha'));
    if (ok) z.tree(k, tx, ty, 300 + i);
  });
  for (const [tx, ty] of [[8, 9], [16, 9], [26, 12], [4, 26], [9, 27], [62, 8], [62, 38], [20, 34]] as [number, number][]) {
    if (!solid[ty][tx] && terrain[ty][tx] === 'grama') z.tree('arbusto', tx, ty, tx * 5 + ty);
  }

  // taboas na beira da água (grama encostada no lago), longe dos cais
  const nearWater = (tx: number, ty: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => terrain[ty + dy]?.[tx + dx] === 'agua');
  const busy = new Set(z.spots.filter(s => s.kind === 'cais' || s.kind === 'ponte' || s.kind === 'barco').map(s => `${s.tx},${s.ty}`));
  const nearDock = (tx: number, ty: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (busy.has(`${tx + dx},${ty + dy}`)) return true;
    return false;
  };
  for (let ty = 3; ty < LAGO_H - 3; ty++) for (let tx = 3; tx < LAGO_W - 3; tx++) {
    if (terrain[ty][tx] !== 'grama' || solid[ty][tx] || !nearWater(tx, ty) || nearDock(tx, ty)) continue;
    if (hash(tx, ty, 91) > 0.45) continue;
    z.put(`taboa-${tx}-${ty}`, swayFrames(reedArt(tx * 3 + ty), 2, 1, 8), tx, ty, 1, 1, false, 230).phase = (tx + ty) % 8;
  }
  // pedras na margem de areia
  for (let ty = 3; ty < LAGO_H - 3; ty++) for (let tx = 3; tx < LAGO_W - 3; tx++) {
    if (terrain[ty][tx] !== 'trilha' || solid[ty][tx] || !nearWater(tx, ty) || nearDock(tx, ty)) continue;
    if (hash(tx, ty, 93) > 0.05) continue;
    z.putLit(`pedras-${tx}-${ty}`, shoreRocks(tx + ty), tx, ty, 1, 1);
  }
  // vitórias-régias grandes perto da margem (flutuam; o barco passa por cima)
  for (let ty = 3; ty < LAGO_H - 3; ty++) for (let tx = 3; tx < LAGO_W - 3; tx++) {
    if (terrain[ty][tx] !== 'agua' || nearDock(tx, ty)) continue;
    const shore = [[2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dy]) => terrain[ty + dy]?.[tx + dx] !== 'agua');
    if (!shore || hash(tx, ty, 95) > 0.06) continue;
    z.objects.push({ id: `vitoria-${tx}-${ty}`, pix: lilyPads(tx * 7 + ty), x: tx * TILE, y: ty * TILE, baseY: ty * TILE - 30 });
  }

  z.waterBlocks();
  // cais, píeres e ponte: dá para andar em cima da água
  for (const s of z.spots) if (s.kind === 'cais' || s.kind === 'ponte') solid[s.ty][s.tx] = false;
  z.scatter(0.05);

  // ── saída ──
  z.exit({ x0: 0, y0: LAGO_WEST.y0, x1: 0, y1: LAGO_WEST.y1, to: 'cidade', at: { tx: 62, ty: 20 }, keep: 'y', dir: 'west' });

  const { ground, groundNight } = z.paintGround(opts, 'lago');
  z.natureFx();
  // vaga-lumes nas taboas e peixes pulando no lago
  z.fx.fireflies.push({ x0: 24 * TILE, y0: 6 * TILE, x1: 60 * TILE, y1: 9 * TILE }, { x0: 26 * TILE, y0: 38 * TILE, x1: 60 * TILE, y1: 41 * TILE });
  z.fx.splashes = [{ x0: (LAKE.cx - 14) * TILE, y0: (LAKE.cy - 10) * TILE, x1: (LAKE.cx + 14) * TILE, y1: (LAKE.cy + 10) * TILE }];
  const box = { x0: 0, y0: 0, x1: LAGO_W, y1: LAGO_H };
  return z.finish('lago', ground, groundNight, { tx: 2, ty: 20 }, { waterAnim: box });
}
