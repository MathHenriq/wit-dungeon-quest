// Cidade WIT (sul do Centro): onde ficam os cursos do Núcleo WIT e as
// profissões. Núcleo WIT no meio, os prédios dos cursos (IA, IoT, Metaverso,
// Comunicação Digital, Games), Mercado Central, Central de Entregas, estúdios
// de música e arte, a praça com o telão do Jornal WIT e as árvores solares,
// o parque e as moradias. Postes inteligentes (IoT) acendem quando alguém passa.
import { TILE } from './buildings';
import type { WorldAssets } from './assets';
import * as P from './props';
import { hex, type Pixmap } from './pixmap';
import {
  arcade, casaInteligente, centralEntregas, estudioComunicacao, hologramFrames, hoop, labIA, mercadoCentral, metaverso, nucleoWit, oficinaGames,
  scooterDock, smartPlanter, solarTree, sportsCourt, telao, TELAO_SCREEN, weatherStation,
} from './buildings-wit';
import { cottage } from './houses-hd';
import { LED } from './palette';
import { topPixel, ZoneBuilder, type Town, type ZoneOptions } from './zone';
import { findPlaque } from './assets';
import { mirrored } from './art-override';

export const WIT_W = 72;
export const WIT_H = 48;
/** Entrada pelo norte (vindo do Centro). */
export const WIT_NORTH = { x0: 18, x1: 21 };
export const PLAZA_WIT = { x0: 22, y0: 14, x1: 49, y1: 27 };

export function buildWit(assets?: WorldAssets, opts: ZoneOptions = {}): Town {
  const A: WorldAssets = assets ?? {};
  const z = new ZoneBuilder(A, WIT_W, WIT_H);
  const { terrain, solid } = z;
  const sprite = (name: string, fallback: () => { pix: Pixmap; night?: Pixmap }) => z.sprLit(name, fallback);
  const W = WIT_W, H = WIT_H;
  void terrain;

  // ── terreno: calçadas tecnológicas, praça, ruas, parque ──
  z.fill('calcada', WIT_NORTH.x0, 0, WIT_NORTH.x1 - WIT_NORTH.x0 + 1, 12);   // passarela que desce do Centro
  z.fill('calcada', 2, 12, W - 4, 2);                                       // rua de cima
  z.fill('calcada', PLAZA_WIT.x0, PLAZA_WIT.y0, PLAZA_WIT.x1 - PLAZA_WIT.x0 + 1, PLAZA_WIT.y1 - PLAZA_WIT.y0 + 1);   // praça
  z.fill('calcada', 34, PLAZA_WIT.y1 + 1, 4, 8);                            // praça → rua de baixo
  z.fill('calcada', 2, 35, W - 4, 2);                                       // rua de baixo
  z.fill('calcada', 8, 14, 2, 21);                                          // ligação oeste
  z.fill('calcada', 60, 14, 2, 21);                                         // ligação leste
  z.shape('flores', 24, 15, ['###', '###']); z.shape('flores', 45, 15, ['###', '###']);
  z.shape('flores', 24, 25, ['###', '###']); z.shape('flores', 45, 25, ['###', '###']);
  z.blob('flores', 64, 42, 3, 1.5, 3, 0.2);
  z.blob('agua', 58, 42, 3.5, 2.2, 6, 0.2);                                 // laguinho do parque

  z.forestEdge([{ side: 'n', from: WIT_NORTH.x0, to: WIT_NORTH.x1 }]);

  // ── prédios de cima (portas na linha 11, rua nas linhas 12-13) ──
  z.building(z.sprB('casa-iot', 'casa-iot', 'Casa Inteligente', 6, 3, [3], casaInteligente), 2, 9);
  z.building(z.sprB('lab-ia', 'lab-ia', 'Laboratório de IA', 7, 4, [3], labIA), 10, 8);
  z.building(z.sprB('nucleo-wit', 'nucleo-wit', 'Núcleo WIT', 12, 5, [5, 6], nucleoWit), 26, 7);
  // a antena do Estúdio pisca: a luz vai no pixel mais alto da arte
  const studio = z.building(z.sprB('estudio-comunicacao', 'estudio', 'Estúdio de Comunicação', 6, 4, [2], estudioComunicacao), 40, 8);
  const tip = topPixel(studio);
  if (tip) z.fx.beacons.push(tip);
  z.building(z.sprB('metaverso', 'metaverso', 'Metaverso', 7, 4, [3], metaverso), 47, 8);
  z.building(z.sprB('central-entregas', 'entregas', 'Central de Entregas', 7, 4, [2], centralEntregas), 56, 8);
  z.building(z.sprB('casa-coworking', 'casa-coworking', 'Coworking WIT', 5, 3, [2], () => cottage('casa-coworking', 'Coworking WIT', {
    wall: hex('#e8eef4'), wallKind: 'plaster', roof: hex('#3a4a6a'), trim: hex('#8cc63f'), shutters: hex('#3a4a6a'),
    sign: { text: 'COWORK', bg: hex('#2a3a50'), lit: LED.green }, chimney: false, seed: 12,
  })), 64, 9);

  // ── praça: telão do Jornal WIT, árvores solares, canteiros inteligentes, bancos ──
  const telX = 33, telY = 18;
  const tel = z.building(z.sprB('telao', 'telao', 'Telão', 6, 1, [], telao), telX, telY);
  // a tela: no telão do GPT, o maior retângulo escuro da arte; no por código, o lugar certo
  const box = A.telao ? findPlaque(tel.pix, c => c[0] + c[1] + c[2] < 150) : null;
  const scr = box ? { x: box.x0 + 1, y: box.y0 + 1, w: box.x1 - box.x0 - 1, h: box.y1 - box.y0 - 1 } : { x: TELAO_SCREEN.x / 2, y: TELAO_SCREEN.y / 2, w: TELAO_SCREEN.w / 2, h: TELAO_SCREEN.h / 2 };
  const screens = [{ x: tel.x + scr.x, y: tel.y + scr.y, w: scr.w, h: scr.h, baseY: (telY + 1) * TILE }];
  for (let k = 0; k < 6; k++) z.spot('telao', telX + k, telY);
  const solar = z.sprLit('arvore-solar', solarTree);
  for (const [x, y] of [[27, 15], [43, 15], [27, 24], [43, 24]] as [number, number][]) z.putLit(`arvore-solar-${x}-${y}`, solar, x, y, 2, 1);
  const planter = z.sprLit('canteiro-iot', smartPlanter);
  z.putLit('canteiro-iot-1', planter, 29, 22, 2, 1);
  z.putLit('canteiro-iot-2', planter, 40, 22, 2, 1);
  z.spot('canteiro-iot', 29, 22); z.spot('canteiro-iot', 30, 22); z.spot('canteiro-iot', 40, 22); z.spot('canteiro-iot', 41, 22);
  const bench = sprite('banco', () => ({ pix: P.bench() }));
  z.putLit('banco-telao-1', bench, 32, 21, 2, 1);
  z.putLit('banco-telao-2', bench, 37, 21, 2, 1);
  z.putLit('patinetes', z.sprLit('patinetes', scooterDock), 22, 12 + 2, 2, 1);
  z.spot('patinetes', 22, 14); z.spot('patinetes', 23, 14);
  const vase = sprite('vaso', () => ({ pix: P.rock() }));
  for (const [x, y] of [[23, 20], [48, 20]] as [number, number][]) z.putLit(`vaso-${x}-${y}`, vase, x, y, 1, 1);

  // holograma do W girando no meio da praça
  z.putLit('holograma', hologramFrames(), 35, 25, 2, 1, true, 160);
  z.spot('holograma', 35, 25); z.spot('holograma', 36, 25);

  // ── quadra de esportes (a oeste da praça) ──
  const court = { x: 11, y: 17, w: 9, h: 6 };
  z.objects.push({ id: 'quadra', pix: A.quadra?.pix ?? sportsCourt(court.w, court.h), x: court.x * TILE, y: court.y * TILE, baseY: court.y * TILE - 30 });
  z.putLit('cesta-1', z.sprLit('cesta', () => hoop(1)), court.x - 1, court.y + 2, 1, 1);
  z.putLit('cesta-2', A.cesta ? { pix: mirrored(A.cesta.pix) } : hoop(-1), court.x + court.w, court.y + 2, 1, 1);
  z.spot('quadra', court.x - 1, court.y + 2); z.spot('quadra', court.x + court.w, court.y + 2);
  z.fill('calcada', court.x, court.y + court.h, 2, 30 - court.y - court.h);

  // ── horta inteligente (a leste da praça): canteiros com sensor e a estação do tempo ──
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = 51 + c * 3, y = 17 + r * 3;
    z.putLit(`horta-iot-${x}-${y}`, planter, x, y, 2, 1);
    z.spot('canteiro-iot', x, y); z.spot('canteiro-iot', x + 1, y);
  }
  z.putLit('estacao-tempo', z.sprLit('estacao-tempo', weatherStation), 59, 18, 1, 1);
  z.spot('estacao-tempo', 59, 18);

  // ── prédios de baixo (portas na linha 34, rua nas linhas 35-36) ──
  z.building(z.sprB('oficina-games', 'oficina-games', 'Oficina de Games', 7, 4, [3], oficinaGames), 4, 31);
  z.putLit('fliperama-1', z.sprLit('fliperama', () => arcade(hex('#e84a6a'))), 12, 34, 1, 1);
  z.putLit('fliperama-2', z.sprLit('fliperama', () => arcade(hex('#3a78c8'))), 13, 34, 1, 1);
  z.spot('fliperama', 12, 34); z.spot('fliperama', 13, 34);
  z.building(z.sprB('mercado-central', 'mercado', 'Mercado Central', 10, 4, [4, 5], mercadoCentral), 22, 31);
  z.building(z.sprB('estudio-musica', 'estudio-musica', 'Estúdio de Música', 5, 3, [2], () => cottage('estudio-musica', 'Estúdio de Música', {
    wall: hex('#6a4a9a'), wallKind: 'planks', roof: hex('#2a2440'), trim: hex('#f4f0ea'), shutters: hex('#f0c040'),
    sign: { text: 'MUSICA', bg: hex('#2a1a40'), lit: [255, 140, 220] }, chimney: false, seed: 14,
  })), 39, 32);
  z.building(z.sprB('atelie', 'atelie', 'Ateliê de Arte', 5, 3, [2], () => cottage('atelie', 'Ateliê de Arte', {
    wall: hex('#f4e0c8'), wallKind: 'plaster', roof: hex('#e87a4a'), trim: hex('#ffffff'), shutters: hex('#4a9ae8'),
    sign: { text: 'ARTE', bg: hex('#c84a6a') }, chimney: false, seed: 15,
  })), 45, 32);
  z.fill('calcada', 41, 35, 1, 0);

  // ── moradias dos alunos (embaixo) e o parque ──
  const homes: [string, string, string, string][] = [['#8ad0c8', '#2a6a7a', '#f4f0ea', 'Moradia 1'], ['#f0c8a0', '#8a4a3a', '#ffffff', 'Moradia 2'], ['#c8d8f0', '#4a5a8a', '#f4f0ea', 'Moradia 3'], ['#f0e8a0', '#6a8a3a', '#ffffff', 'Moradia 4']];
  homes.forEach(([wall, roof, trim, name], k) => {
    const x = 4 + k * 8;
    z.building(z.sprB(`moradia-${k + 1}`, `moradia-${k + 1}`, name, 5, 3, [2], () => cottage(`moradia-${k + 1}`, name, { wall: hex(wall), wallKind: k % 2 ? 'plaster' : 'planks', roof: hex(roof), trim: hex(trim), shutters: hex(roof), seed: 20 + k })), x, 40);
    z.fill('calcada', x + 2, 43, 1, 1);
  });
  z.fill('calcada', 2, 44, 36, 1);
  z.fill('calcada', 8, 37, 2, 7);
  // parque: árvores, banco na beira do laguinho, fliperama ao ar livre
  const groves: [import('./props').TreeKind, number, number][] = [
    ['redonda', 44, 39], ['florida', 48, 41], ['pinheiro', 52, 38], ['redonda', 64, 38], ['florida', 67, 43],
    ['redonda', 3, 15], ['florida', 3, 20], ['redonda', 64, 17], ['florida', 66, 22], ['redonda', 64, 27], ['florida', 3, 26],
    ['florida', 12, 25], ['redonda', 16, 25], ['pinheiro', 17, 29], ['redonda', 52, 28], ['florida', 56, 28], ['redonda', 19, 15],
  ];
  groves.forEach(([k, tx, ty], i) => {
    const ok = [0, 1].every(dy => [0, 1].every(dx => !solid[ty + dy]?.[tx + dx] && z.terrain[ty + dy]?.[tx + dx] === 'grama'));
    if (ok) z.tree(k, tx, ty, 700 + i);
  });
  z.putLit('banco-parque', bench, 55, 39, 2, 1);
  const sign = sprite('placa', () => ({ pix: P.signPost() }));
  z.putLit('placa-entrada', sign, 22, 3, 1, 1);
  z.spot('placa', 22, 3, { lines: ['CIDADE WIT', 'Aqui ficam os cursos do Núcleo WIT: IA, IoT, Metaverso, Comunicação Digital e Oficina de Games.', 'Os postes são inteligentes: acendem quando alguém passa. ↑ Centro'] });
  z.putLit('placa-parque', sign, 50, 36 + 1, 1, 1);
  z.spot('placa', 50, 37, { lines: ['PARQUE TECNOLÓGICO', 'O canteiro e os postes daqui são ligados na rede (IoT). Os drones das entregas passam por cima!'] });

  // ── postes inteligentes ──
  for (const [x, y] of [[17, 4], [22, 8], [17, 10], [5, 14], [14, 14], [24, 14], [47, 14], [56, 14], [66, 14], [26, 20], [45, 20], [33, 27], [38, 27], [5, 37], [18, 37], [30, 37], [42, 37], [54, 37], [66, 37], [20, 45], [36, 45]] as [number, number][]) {
    if (!solid[y]?.[x]) z.lamp(x, y, true);
  }

  z.waterBlocks();
  const nearWalk = (tx: number, ty: number) => {
    if (tx >= 10 && tx <= 20 && ty >= 16 && ty <= 23) return true;   // quadra
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (z.terrain[ty + dy]?.[tx + dx] === 'calcada') return true;
    return false;
  };
  z.scatter(0.05, undefined, undefined, nearWalk);

  z.exit({ x0: WIT_NORTH.x0, y0: 0, x1: WIT_NORTH.x1, y1: 0, to: 'cidade', at: { tx: 30, ty: 46 }, keep: 'x', dir: 'north' });

  const { ground, groundNight } = z.paintGround(opts, 'wit');
  z.natureFx();
  return z.finish('wit', ground, groundNight, { tx: WIT_NORTH.x0 + 1, ty: 2 }, { screens });
}
