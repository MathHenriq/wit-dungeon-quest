// Fazenda do Vale (oeste do Centro): a casa da fazenda, os dois campos para
// plantar, celeiro e silo com o pasto das vacas e ovelhas, galinheiro com o
// terreiro, estufa, moinho, poço, barraca de sementes, caixa de envio, lagoa
// e o pomar. Tudo em blocos de 16 px; a arte sai de buildings-fazenda.ts.
import { TILE } from './buildings';
import type { WorldAssets } from './assets';
import * as P from './props';
import { hash, hex, type Pixmap } from './pixmap';
import {
  barn, coop, cropArt, fenceV, fruitTree, greenhouse, hayBale, picnicTable, scarecrow, seedStall, shippingBin, silo, soilArt, well, wheelbarrow, windmill,
  type CropArtId,
} from './buildings-fazenda';
import { cottage } from './houses-hd';
import { swayFrames } from './motion';
import { reedArt, ZoneBuilder, type Town, type ZoneOptions } from './zone';

export const FAZENDA_W = 72;
export const FAZENDA_H = 48;
/** Entrada pelo leste (vindo do Centro). */
export const FAZENDA_EAST = { y0: 20, y1: 21 };
/** Os campos de plantar (blocos). */
export const FIELDS = [
  { x0: 25, y0: 17, x1: 40, y1: 26 },
];
/** A horta do Seu Joca (já plantada, só de enfeite). */
export const JOCA = { x0: 25, y0: 32, x1: 40, y1: 39 };
/** Onde os bichos andam (blocos). */
export const PASTURE = { x0: 3, y0: 13, x1: 20, y1: 24 };
export const HENYARD = { x0: 53, y0: 7, x1: 59, y1: 10 };
export const POND = { cx: 10, cy: 36, rx: 6, ry: 4 };

export function buildFazenda(assets?: WorldAssets, opts: ZoneOptions = {}): Town {
  const A: WorldAssets = assets ?? {};
  const z = new ZoneBuilder(A, FAZENDA_W, FAZENDA_H);
  const { terrain, solid } = z;
  const sprite = (name: string, fallback: () => { pix: Pixmap; night?: Pixmap }) => z.sprLit(name, fallback);
  const W = FAZENDA_W;

  // ── terreno ──
  z.fill('trilha', 60, FAZENDA_EAST.y0, W - 60, 2);                   // estrada que vem do Centro
  z.fill('trilha', 8, 13, 54, 2);                                     // rua da fazenda (em frente às casas)
  z.fill('trilha', 60, 15, 2, 5);
  z.fill('trilha', 8, 11, 2, 2);                                      // porta do celeiro → rua
  z.fill('trilha', 22, 15, 2, 26);                                    // caminho a oeste dos campos
  z.fill('trilha', 24, 28, 22, 2);                                    // entre o campo e a horta
  z.fill('trilha', 44, 20, 16, 2);                                    // estrada → poço e campo
  z.blob('mato', 12, 20, 5, 2.5, 3, 0.3);                             // capim do pasto
  z.blob('agua', POND.cx, POND.cy, POND.rx, POND.ry, 4, 0.25);        // lagoa
  z.fill('trilha', 44, 22, 2, 8); z.fill('trilha', 46, 28, 18, 2);    // caminho do pomar
  z.shape('flores', 27, 11, ['####', '####']);
  z.shape('flores', 38, 11, ['###']);
  z.shape('mato', 2, 42, ['.####..', '#######', '.#####.']);

  z.forestEdge([{ side: 'e', from: FAZENDA_EAST.y0, to: FAZENDA_EAST.y1 }]);

  // ── casa da fazenda (no meio, olhando para a rua) ──
  z.building(cottage('casa-fazenda', 'Casa da Fazenda', {
    wall: hex('#f0e2c4'), wallKind: 'planks', roof: hex('#b8483a'), shutters: hex('#3a8a4a'), trim: hex('#f8f4ec'), tw: 6, seed: 9,
    extras: (a, g) => {
      // varanda: tábuas no chão e dois postes
      a.rect(10, g.base - 4, g.W - 20, 4, hex('#c89a62'));
      for (const x of [14, g.W - 18]) { a.rect(x, g.wallTop + 6, 4, g.base - g.wallTop - 6, hex('#f8f4ec')); a.vline(x + 3, g.wallTop + 6, g.base - g.wallTop - 6, hex('#c8c0b4')); }
    },
  }), 30, 10);
  z.putLit('caixa-envio', shippingBin(), 37, 12, 2, 1);
  z.spot('caixa-envio', 37, 12); z.spot('caixa-envio', 38, 12);
  const mail = sprite('correio', () => ({ pix: P.mailbox(hex('#e84848')) }));
  z.putLit('correio-fazenda', mail, 29, 12, 1, 1);
  z.spot('correio', 29, 12, { own: false });

  // ── moinho, galinheiro com o terreiro, estufa ──
  const mill = windmill();
  z.building(mill, 44, 7);
  z.objects[z.objects.length - 1].frameMs = 260;
  z.building(coop(), 48, 9);
  z.building(greenhouse(), 62, 9);
  const fence = sprite('cerca', () => ({ pix: P.fence() })), fv = fenceV();
  // terreiro das galinhas, do lado do galinheiro (a cerca de baixo fica encostada na rua)
  for (let x = HENYARD.x0 - 1; x <= HENYARD.x1 + 1; x++) { z.putLit(`cerca-terreiro-s-${x}`, fence, x, HENYARD.y1 + 1, 1, 1); z.putLit(`cerca-terreiro-n-${x}`, fence, x, HENYARD.y0 - 1, 1, 1); }
  for (let y = HENYARD.y0; y <= HENYARD.y1; y++) { z.putLit(`cerca-terreiro-w-${y}`, fv, HENYARD.x0 - 1, y, 1, 1); z.putLit(`cerca-terreiro-e-${y}`, fv, HENYARD.x1 + 1, y, 1, 1); }
  // ninho: de frente para o galinheiro, pega os ovos do dia
  for (let k = 0; k < 4; k++) z.spot('ninho', 48 + k, 11);

  // ── celeiro, silo e o pasto ──
  z.building(barn(), 6, 7);
  z.building(silo(), 13, 9);
  for (const [x, y] of [[15, 10], [16, 10], [2, 11]] as [number, number][]) z.putLit(`feno-${x}-${y}`, hayBale(), x, y, 1, 1);
  for (let x = PASTURE.x0 - 1; x <= PASTURE.x1 + 1; x++) {
    if (x !== 8 && x !== 9) z.putLit(`cerca-pasto-n-${x}`, fence, x, PASTURE.y0 - 1, 1, 1);
    z.putLit(`cerca-pasto-s-${x}`, fence, x, PASTURE.y1 + 1, 1, 1);
  }
  for (let y = PASTURE.y0; y <= PASTURE.y1; y++) if (y < 18 || y > 19) z.putLit(`cerca-pasto-e-${y}`, fv, PASTURE.x1 + 1, y, 1, 1);
  z.putLit('cocho', hayBale(), 17, 15, 1, 1);

  // ── campo comunitário: cercado, com entradas no meio de cada lado ──
  for (const f of FIELDS) {
    const midX = (f.x0 + f.x1) >> 1, midY = (f.y0 + f.y1) >> 1;
    for (let x = f.x0 - 1; x <= f.x1 + 1; x++) {
      if (Math.abs(x - midX) > 1) z.putLit(`cerca-campo-n-${x}`, fence, x, f.y0 - 1, 1, 1);
      if (Math.abs(x - midX) > 1) z.putLit(`cerca-campo-s-${x}`, fence, x, f.y1 + 1, 1, 1);
    }
    for (let y = f.y0; y <= f.y1; y++) {
      if (Math.abs(y - midY) > 1) z.putLit(`cerca-campo-w-${y}`, fv, f.x0 - 1, y, 1, 1);
      if (Math.abs(y - midY) > 1) z.putLit(`cerca-campo-e-${y}`, fv, f.x1 + 1, y, 1, 1);
    }
    z.spot('campo', f.x0, f.y0, { x1: f.x1, y1: f.y1 });
  }
  z.putLit('espantalho-1', scarecrow(), FIELDS[0].x1 + 2, FIELDS[0].y0, 1, 1);
  z.putLit('poco', well(), 42, 18, 2, 1);
  z.spot('poco', 42, 18); z.spot('poco', 43, 18);
  z.putLit('carrinho', wheelbarrow(), 42, 24, 1, 1);

  // ── horta do Seu Joca: fileiras já plantadas (dá para andar entre elas) ──
  const soilWet = soilArt(true), kinds: [CropArtId, number][] = [['milho', 5], ['tomate', 4], ['girassol', 4], ['cenoura', 3], ['abobora', 6], ['alface', 3], ['morango', 4]];
  for (let y = JOCA.y0; y <= JOCA.y1; y += 2) {
    const [crop, last] = kinds[((y - JOCA.y0) / 2) % kinds.length];
    for (let x = JOCA.x0; x <= JOCA.x1; x++) {
      const stage = Math.min(last, 1 + Math.floor(hash(x, y, 7) * last) + (hash(x, y, 9) > 0.5 ? 1 : 0));
      z.objects.push({ id: `horta-terra-${x}-${y}`, pix: soilWet, x: x * TILE, y: y * TILE, baseY: y * TILE - 20 });
      z.put(`horta-${crop}-${x}-${y}`, cropArt(crop, stage, last), x, y, 1, 1, true);
    }
  }
  z.putLit('espantalho-2', scarecrow(), JOCA.x1 + 2, JOCA.y1, 1, 1);
  z.putLit('placa-joca', sprite('placa', () => ({ pix: P.signPost() })), JOCA.x0 - 1, JOCA.y0 - 1, 1, 1);
  z.spot('placa', JOCA.x0 - 1, JOCA.y0 - 1, { lines: ['HORTA DO SEU JOCA', 'Milho, tomate, girassol, cenoura, abóbora, alface e morango.', '"Pode olhar, mas não pode pisar!"'] });

  // ── barraca de sementes na chegada ──
  z.putLit('barraca-sementes', seedStall(), 54, 17, 3, 1);
  for (let k = 0; k < 3; k++) z.spot('sementes', 54 + k, 17);
  const sign = sprite('placa', () => ({ pix: P.signPost() }));
  z.putLit('placa-entrada', sign, 66, 19, 1, 1);
  z.spot('placa', 66, 19, { lines: ['FAZENDA DO VALE', 'Are a terra, plante, regue todo dia e colha. A caixa de envio paga quando o dia vira (às 6h).', 'Centro →'] });
  z.putLit('placa-campo', sign, 24, 16, 1, 1);
  z.spot('placa', 24, 16, { lines: ['CAMPO COMUNITÁRIO', 'De frente para a terra, ESPAÇO faz a ação certa: arar, plantar a semente escolhida, regar ou colher.', 'O regador enche no poço ou na lagoa.'] });

  // ── lagoa com piquenique ──
  z.putLit('mesa-piquenique', picnicTable(), 17, 33, 2, 1);
  z.putLit('banco-lagoa', sprite('banco', () => ({ pix: P.bench() })), 17, 38, 2, 1);

  // ── pomar ──
  const fruits: [string, string][] = [['maca', '#e83a3a'], ['laranja', '#f09a2a'], ['pessego', '#f8a0a0'], ['limao', '#e8e040']];
  const round = A['arvore-redonda'];
  let n = 0;
  for (let y = 31; y <= 41; y += 4) for (let x = 48; x <= 64; x += 4, n++) {
    const [fruit, c] = fruits[n % fruits.length];
    if (round) {
      const pix = fruitTree(round.pix, hex(c), n + 3);
      const o = z.put(`pomar-${fruit}-${x}-${y}`, pix, x, y, 2, 2);
      o.night = round.night;
      z.fx.leaves.push([o.x + o.pix.w / 2, o.y + o.pix.h * 0.35]);
    } else z.tree('redonda', x, y, n);
    z.spot('fruta', x, y + 1, { fruit, tree: `${x}-${y}` }); z.spot('fruta', x + 1, y + 1, { fruit, tree: `${x}-${y}` });
  }

  // ── árvores, arbustos e o resto ──
  const groves: [P.TreeKind, number, number][] = [
    ['redonda', 3, 3], ['pinheiro', 20, 3], ['florida', 26, 4], ['redonda', 40, 3], ['pinheiro', 58, 3],
    ['florida', 4, 29], ['redonda', 18, 42], ['pinheiro', 30, 42], ['redonda', 40, 43], ['florida', 46, 42],
    ['pinheiro', 66, 26], ['redonda', 2, 31],
  ];
  groves.forEach(([k, tx, ty], i) => {
    const ok = [0, 1].every(dy => [0, 1].every(dx => !solid[ty + dy]?.[tx + dx] && terrain[ty + dy]?.[tx + dx] === 'grama'));
    if (ok) z.tree(k, tx, ty, 500 + i);
  });
  // taboas na beira da lagoa
  for (let ty = POND.cy - POND.ry - 1; ty <= POND.cy + POND.ry + 1; ty++) for (let tx = POND.cx - POND.rx - 1; tx <= POND.cx + POND.rx + 1; tx++) {
    if (terrain[ty]?.[tx] !== 'grama' || solid[ty][tx]) continue;
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => terrain[ty + dy]?.[tx + dx] === 'agua') || (tx * 7 + ty) % 3) continue;
    z.put(`taboa-${tx}-${ty}`, swayFrames(reedArt(tx * 3 + ty), 2, 1, 8), tx, ty, 1, 1, false, 230).phase = (tx + ty) % 8;
  }
  z.lamp(59, 19); z.lamp(47, 12); z.lamp(36, 12); z.lamp(21, 15); z.lamp(21, 30); z.lamp(12, 12);

  z.waterBlocks();
  const inField = (tx: number, ty: number) => [...FIELDS, JOCA].some(f => tx >= f.x0 - 1 && tx <= f.x1 + 1 && ty >= f.y0 - 1 && ty <= f.y1 + 1);
  z.scatter(0.05, undefined, undefined, inField);

  z.exit({ x0: W - 1, y0: FAZENDA_EAST.y0, x1: W - 1, y1: FAZENDA_EAST.y1, to: 'cidade', at: { tx: 1, ty: 20 }, keep: 'y', dir: 'east' });

  const { ground, groundNight } = z.paintGround(opts, 'fazenda');
  z.natureFx();
  z.fx.fireflies.push({ x0: (POND.cx - POND.rx) * TILE, y0: (POND.cy - POND.ry) * TILE, x1: (POND.cx + POND.rx) * TILE, y1: (POND.cy + POND.ry) * TILE });
  return z.finish('fazenda', ground, groundNight, { tx: W - 3, ty: 20 }, { waterAnim: { x0: POND.cx - POND.rx - 2, y0: POND.cy - POND.ry - 2, x1: POND.cx + POND.rx + 2, y1: POND.cy + POND.ry + 2 } });
}
