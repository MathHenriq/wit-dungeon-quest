// Planta do Centro (a cidade inicial): terrenos, prédios, objetos, colisão,
// portas e as saídas para as outras áreas. Tudo em coordenadas de bloco (16 px).
// A arte sai de ground/props/buildings; o kit de montar fica em zone.ts.
import { TILE } from './buildings';
import { circuitPixels, paintCircuits, type Circuit } from './ground';
import { applyTimeOfDay, lightHalo, timeOfDay } from './light';
import { hash, hex, Pixmap } from './pixmap';
import { LED, PAVE } from './palette';
import * as P from './props';
import * as T from './props-tech';
import { swayFrames } from './motion';
import { waterFrames, type WorldAssets } from './assets';
import { HOUSE_MODELS, NPC_HOUSES } from './content';
import { houseHG } from './house-hg';
import { arenaHG, towerHG } from './buildings-hg';
import { cardWorkshop, guildCastle, packShop } from './landmarks';
import { labeled, lakeFrames, pierArt, reedArt, ZoneBuilder, type GlowSpot, type Lamp, type Placed, type Town, type ZoneOptions } from './zone';

export type { Ambient, Door, GlowSpot, Lamp, Placed, Town } from './zone';

export const MAP_W = 64;
export const MAP_H = 48;

/** Onde o Centro liga com as outras áreas (blocos da borda). */
export const CIDADE_EXITS = {
  oeste: { y0: 20, y1: 21 },
  leste: { y0: 20, y1: 21 },
  sul: { x0: 30, x1: 33 },
};

/**
 * Monta o Centro. Com `assets` (sprites convertidos do GPT) usa essa arte;
 * sem eles, a arte feita por código. A planta, a colisão e as portas são as
 * mesmas nos dois casos.
 */
export interface BuildOptions extends ZoneOptions {
  /** Modelo da Sua Casa. */
  casa?: string;
}

export function buildTown(assets?: WorldAssets, opts: BuildOptions = {}): Town {
  const A: WorldAssets = assets ?? {};
  const z = new ZoneBuilder(A, MAP_W, MAP_H);
  const { terrain, solid, objects, fx } = z;
  const groundTex = z.groundTex;
  const fill = z.fill.bind(z), block = z.block.bind(z), put = z.put.bind(z), putLit = z.putLit.bind(z);
  const building = z.building.bind(z), sprB = z.sprB.bind(z), sprLit = z.sprLit.bind(z), shape = z.shape.bind(z);
  const treeAt = z.tree.bind(z), behind = z.behind.bind(z), decor = z.decor.bind(z);

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
  fillT('calcada', 0, 20, PLAZA.x0, 2);                      // avenida oeste (saída para a Fazenda)
  fillT('calcada', PLAZA.x1 + 1, 20, MAP_W - PLAZA.x1 - 1, 2); // avenida leste (saída para o Lago)
  fillT('calcada', 31, PLAZA.y1 + 1, 2, MAP_H - PLAZA.y1 - 1); // avenida sul (saída para a Cidade WIT)
  fillT('calcada', 15, 19, 3, 1);           // Oficina → avenida
  fillT('calcada', 45, 19, 3, 1);           // Loja → avenida
  fillT('trilha', 15, 31, 3, 1);            // Castelo → rua
  fillT('trilha', 45, 31, 4, 1);            // Arena → rua
  shape('agua', 3, 35, ['...###..', '.######.', '#######.', '########', '.#######', '..####..']);   // lago
  shape('mato', 58, 16, ['.###', '####', '###.']);         // mato alto na saída leste
  shape('mato', 58, 22, ['###.', '####', '.##.']);
  shape('mato', 24, 44, ['.####', '####.']);               // e na saída sul
  shape('mato', 35, 44, ['####.', '.####']);
  fillT('flores', 24, 27, 5, 1);            // canteiros dos parquinhos da praça
  fillT('flores', 35, 27, 5, 1);
  fillT('flores', 58, 37, 3, 3);            // horta do fazendeiro
  // chão de mata na borda (entre as árvores), com as saídas oeste, sul e leste
  const W_ = CIDADE_EXITS.oeste, E_ = CIDADE_EXITS.leste, S_ = CIDADE_EXITS.sul;
  fillT('floresta', 0, 0, MAP_W, 2);
  fillT('floresta', 0, MAP_H - 2, S_.x0, 2); fillT('floresta', S_.x1 + 1, MAP_H - 2, MAP_W - S_.x1 - 1, 2);
  fillT('floresta', 0, 0, 2, W_.y0); fillT('floresta', 0, W_.y1 + 1, 2, MAP_H - W_.y1 - 1);
  fillT('floresta', MAP_W - 2, 0, 2, E_.y0); fillT('floresta', MAP_W - 2, E_.y1 + 1, 2, MAP_H - E_.y1 - 1);

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

  // ── árvores: mata na borda (com as três saídas) + grupos pela cidade ──
  const southGap = (tx: number) => tx >= S_.x0 - 1 && tx <= S_.x1;
  const eastGap = (ty: number) => ty >= E_.y0 - 1 && ty <= E_.y1;
  const westGap = (ty: number) => ty >= W_.y0 - 1 && ty <= W_.y1;
  for (let tx = -1; tx < MAP_W; tx += 2) behind(tx, -1, tx + 40);
  for (let tx = -1; tx < MAP_W; tx += 2) if (!southGap(tx) && !southGap(tx + 1)) behind(tx, MAP_H - 1, tx + 60);
  for (let ty = 1; ty < MAP_H; ty += 2) {
    if (!westGap(ty) && !westGap(ty + 1)) behind(-1, ty, ty + 80);
    if (!eastGap(ty) && !eastGap(ty + 1)) behind(MAP_W - 1, ty, ty + 90);
  }
  for (let tx = 0; tx < MAP_W; tx += 2) {
    treeAt('pinheiro', tx, 0, tx);
    if (!southGap(tx) && !southGap(tx + 1)) treeAt('pinheiro', tx, MAP_H - 2, tx + 1);
  }
  for (let ty = 2; ty < MAP_H - 2; ty += 2) {
    if (!westGap(ty) && !westGap(ty + 1)) treeAt('pinheiro', 0, ty, ty + 3);
    if (!eastGap(ty) && !eastGap(ty + 1)) treeAt('pinheiro', MAP_W - 2, ty, ty + 5);
  }
  block(0, 0, MAP_W, 2); block(0, MAP_H - 2, S_.x0, 2); block(S_.x1 + 1, MAP_H - 2, MAP_W - S_.x1 - 1, 2);
  block(0, 0, 2, W_.y0); block(0, W_.y1 + 1, 2, MAP_H - W_.y1 - 1);
  block(MAP_W - 2, 0, 2, E_.y0); block(MAP_W - 2, E_.y1 + 1, 2, MAP_H - E_.y1 - 1);
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
  const fo = putLit('fonte', fountainArt, FOUNTAIN.tx, FOUNTAIN.ty, 4, 2, true, 180);
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
  const lamps: [number, number][] = [
    [28, 16], [35, 16], [28, 24], [35, 24],                    // praça
    [3, 19], [12, 22], [21, 19], [42, 22], [50, 19], [60, 19], // avenidas
    [30, 28], [33, 36], [30, 41],                              // avenida sul
    [12, 9], [25, 9], [38, 9], [58, 9], [8, 31], [56, 31], [16, 41], [49, 41], // ruas
  ];
  // o poste entra sem a camada da noite: quem acende é o jogo, poste a poste
  for (const [tx, ty] of lamps) z.lamp(tx, ty);
  putLit('maquina', sprLit('maquina', T.vendingLit), 49, 18, 1, 1);
  const sign = sprLit('placa', () => ({ pix: P.signPost() }));
  putLit('placa-guildas', sign, 12, 31, 1, 1);
  putLit('placa-arena', sign, 51, 31, 1, 1);
  putLit('placa-lago', sign, 11, 41, 1, 1);
  // placas das saídas (ler: espaço de frente)
  putLit('placa-fazenda', sign, 5, 22, 1, 1);
  putLit('placa-leste', sign, 57, 22, 1, 1);
  putLit('placa-sul', sign, 29, 43, 1, 1);
  z.spot('placa', 5, 22, { lines: ['← FAZENDA DO VALE', 'Campos para plantar, celeiro, animais e a barraca de sementes.'] });
  z.spot('placa', 57, 22, { lines: ['LAGO AZUL →', 'Casa de Pesca, píeres para pescar e o barquinho para atravessar o lago.'] });
  z.spot('placa', 29, 43, { lines: ['↓ CIDADE WIT', 'Onde ficam os cursos do Núcleo WIT: IA, IoT, Metaverso, Comunicação Digital e Games.'] });
  z.spot('placa', 12, 31, { lines: ['→ Castelo das Guildas', 'Sua equipe, a meta de presença da semana e o chefe da guilda.'] });
  z.spot('placa', 51, 31, { lines: ['← Arena', 'Duelos contra os colegas (em breve).'] });
  z.spot('placa', 11, 41, { lines: ['Laguinho do Centro', 'Para pescar de verdade, vá ao Lago Azul, a leste.'] });

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
    if (!solid[sy][dx + 1] && terrain[sy][dx + 1] === 'grama') {
      putLit(`correio-${dx}`, mail(mailColors[i % mailColors.length]), dx + 1, sy, 1, 1);
      z.spot('correio', dx + 1, sy, { own: i === 0 });
    }
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
      put(`taboa-${tx}-${ty}`, swayFrames(reedArt(seed), 2, 1, 8), tx, ty, 1, 1, false, 230).phase = seed * 3;
    }
  }
  // portal de boas-vindas na saída sul (a Cidade WIT começa ali)
  const arch = A.portal ? labeled(A.portal, 'CIDADE WIT') : T.welcomeArchLit('CIDADE WIT');
  objects.push({ id: 'portal', pix: arch.pix, night: arch.night, x: 30 * TILE + ((64 - arch.pix.w) >> 1), y: 45 * TILE - arch.pix.h + 16, baseY: 46 * TILE });
  block(30, 45, 1, 1); block(33, 45, 1, 1);
  const rock = sprLit('pedra', () => ({ pix: P.rock() }));
  putLit('pedra-1', rock, 11, 36, 1, 1);
  putLit('pedra-2', rock, 60, 30, 1, 1);
  // a fonte da praça: jogar uma moeda e fazer um pedido
  for (let k = 0; k < 4; k++) z.spot('fonte', FOUNTAIN.tx + k, FOUNTAIN.ty + 1);
  for (let k = 0; k < 3; k++) z.spot('mural', 24 + k, 16);
  z.spot('maquina', 49, 18);
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
  z.scatter();

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

  z.waterBlocks();

  // ── saídas ──
  z.exit({ x0: 0, y0: W_.y0, x1: 0, y1: W_.y1, to: 'fazenda', at: { tx: FAZENDA_ENTRY.x, ty: FAZENDA_ENTRY.y0 }, keep: 'y', dir: 'west' });
  z.exit({ x0: MAP_W - 1, y0: E_.y0, x1: MAP_W - 1, y1: E_.y1, to: 'lago', at: { tx: LAGO_ENTRY.x, ty: LAGO_ENTRY.y0 }, keep: 'y', dir: 'east' });
  z.exit({ x0: S_.x0, y0: MAP_H - 1, x1: S_.x1, y1: MAP_H - 1, to: 'wit', at: { tx: WIT_ENTRY.x0, ty: WIT_ENTRY.y }, keep: 'x', dir: 'south' });

  // chão + anel da praça + circuitos
  const { ground, groundNight } = z.paintGround(opts);
  decoratePlaza(ground, groundNight, ring.cx, ring.cy);
  const circuits = plazaCircuits(ring.cx, ring.cy);
  paintCircuits(ground, groundNight, circuits);
  if (ground.hd && groundNight.hd) {
    // anel e circuitos redesenhados em hd (traço fino, curva lisa), de dia e à noite
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
  z.natureFx();
  fx.fireflies.push({ x0: 3 * TILE, y0: 34 * TILE, x1: 11 * TILE, y1: 41 * TILE });
  for (let tx = 4; tx < MAP_W - 4; tx += 5) {
    fx.fireflies.push({ x0: tx * TILE, y0: 2 * TILE, x1: tx * TILE + 48, y1: 3 * TILE });
    if (!(tx >= 26 && tx <= 36)) fx.fireflies.push({ x0: tx * TILE, y0: (MAP_H - 3) * TILE, x1: tx * TILE + 48, y1: (MAP_H - 2) * TILE });
  }
  return z.finish('cidade', ground, groundNight, { tx: 31, ty: 23 }, { circuits: circuits.map(circuitPixels) });
}

/** Onde se chega em cada área vindo do Centro (a primeira linha/coluna da faixa de entrada). */
export const LAGO_ENTRY = { x: 1, y0: 20 };
export const FAZENDA_ENTRY = { x: 70, y0: 20 };
export const WIT_ENTRY = { x0: 34, y: 1 };

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
    [[left + 1, cy], [left - 18, cy], [left - 18 - dy, avenueY], [0, avenueY]],
    [[right - 1, cy], [right + 18, cy], [right + 18 + dy, avenueY], [MAP_W * TILE - 1, avenueY]],
    [[cx - 4, cy + RING.ry], [cx - 4, MAP_H * TILE - 1]],
    [[cx + 4, cy + RING.ry], [cx + 4, MAP_H * TILE - 1]],
    [[16 * TILE + 8, avenueY], [16 * TILE + 8, 19 * TILE + 3]],
    [[46 * TILE + 8, avenueY], [46 * TILE + 8, 19 * TILE + 3]],
  ];
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
  for (const l of town.lamps) if (l.night) lights.blit(l.night, l.x, l.y);
  const halo = lightHalo(lights);
  addGlowSpots(halo, [...town.glowSpots, ...lampSpots(town.lamps)]);
  applyTimeOfDay(out, lights, halo, tod);
  return out;
}

/** Poças de luz dos postes, como GlowSpot (imagens de revisão: todos acesos). */
export function lampSpots(lamps: Lamp[]): GlowSpot[] {
  return lamps.flatMap(l => [
    { x: l.ground[0], y: l.ground[1], r: 26, color: LED.warm, k: 0.32 },
    { x: l.bulb[0], y: l.bulb[1], r: 10, color: LED.warmSoft, k: 0.35 },
  ]);
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

