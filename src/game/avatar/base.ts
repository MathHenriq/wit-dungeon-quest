// Boneco base do WIT Dungeon 2, desenhado pixel a pixel.
//
// Cada letra é uma REGIÃO, não uma cor (ver CODES em compose.ts). Isso permite
// trocar pele, roupa e cabelo por código sem redesenhar nada.
//
//   .  transparente         O  contorno (cor escura da região vizinha)
//   S s k  pele: base, sombra, luz
//   T t U  roupa de cima: base, sombra, luz
//   A a    manga (braço de cima): sempre roupa de cima
//   R r    antebraço: roupa de cima se manga longa, pele se curta
//   H h    mão: pele
//   P p V  roupa de baixo: base, sombra, luz
//   Q q    canela: roupa de baixo se comprida, pele se curta
//   F f G  calçado: base, sombra, luz
//   Y y Z  cabelo: base, sombra, luz
//   D E e  olho: contorno, íris, brilho
//   M      boca        B  bochecha
//
// Quadro de 32×32. Direções: baixo, cima, esquerda (a direita é o espelho da
// esquerda). Poses: parado e dois passos.

export type Dir = 'down' | 'up' | 'left';
export type Pose = 0 | 1 | 2;

export interface Layer {
  x: number;
  y: number;
  rows: readonly string[];
}

export const FRAME = 32;

// ───────────────────────── Cabeça ─────────────────────────
// 16×15, origem em (8, 1).

const HEAD_ROUND = [
  '....OOOOOOOO....',
  '..OOSSSSSSSSOO..',
  '.OSSSSSSSSSSSSO.',
  '.OSSSSSSSSSSSSO.',
  'OSSSSSSSSSSSSSSO',
  'OSSSSSSSSSSSSSSO',
  'OSSSSSSSSSSSSSSO',
  'OkSSSSSSSSSSSSSO',
  'OkSSSSSSSSSSSSsO',
  'OSSSSSSSSSSSSSsO',
  'OsSSSSSSSSSSSSsO',
  '.OsSSSSSSSSSSsO.',
  '.OssSSSSSSSSssO.',
  '..OOsssSSsssOO..',
  '....OOOOOOOO....',
];

const HEAD_SIDE = [
  '....OOOOOOOO....',
  '..OOSSSSSSSSOO..',
  '.OSSSSSSSSSSSSO.',
  '.OSSSSSSSSSSSSO.',
  'OSSSSSSSSSSSSSSO',
  'OSSSSSSSSSSSSSSO',
  'OSSSSSSSSSSSSSSO',
  'OSSSSSSSSSSSSSSO',
  'OSSSSSSSSSSSSSsO',
  'OSSSSSSSSSSSsssO',
  '.OSSSSSSSSSSSssO',
  '.OSSSSSSSSSSSsO.',
  '..OSSSSSSSSSssO.',
  '...OOsSSSsssOO..',
  '.....OOOOOOO....',
];

export const HEAD: Record<Dir, readonly string[]> = {
  down: HEAD_ROUND,
  up: HEAD_ROUND,
  left: HEAD_SIDE,
};

// Rosto, na mesma origem da cabeça.
export const FACE: Record<Dir, readonly string[] | null> = {
  down: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....De....De....',
    '....DE....DE....',
    '....EE....EE....',
    '..BB........BB..',
    '.......MM.......',
    '................',
    '................',
  ],
  up: null,
  left: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...De...........',
    '...DE...........',
    '...EE...........',
    '.BB.............',
    '...M............',
    '................',
    '................',
  ],
};

// ───────────────────────── Corpo ─────────────────────────
// 12×16, origem em (10, 15). A primeira linha fica embaixo do queixo.

const BODY_DOWN_STAND = [
  '...OOOOOO...',
  '..OTTTTTTO..',
  '.OATTTTTTAO.',
  'OAATTUTTTAAO',
  'OAaTTUTTTaAO',
  'ORRtTTTTtRRO',
  'ORrtTTTTtrRO',
  'OHHPPPPPPHHO',
  '.OOPPPPPPOO.',
  '..OPPppPPO..',
  '..OPPOOPPO..',
  '..OQQOOQQO..',
  '..OQqOOqQO..',
  '..OFFOOFFO..',
  '.OFGFOOFGFO.',
  '.OOOO..OOOO.',
];

const BODY_DOWN_STEP_A = [
  '...OOOOOO...',
  '..OTTTTTTO..',
  '.OATTTTTTAO.',
  'OAATTUTTTAAO',
  'OAaTTUTTTaAO',
  'ORRtTTTTtRRO',
  'ORrtTTTTtHHO',
  'OHHPPPPPPOO.',
  '.OOPPPPPPO..',
  '..OPPppPPO..',
  '..OPPOOPPO..',
  '..OQQOOQQO..',
  '..OQqOOFFO..',
  '..OFFOOGFO..',
  '.OFGFO.OOO..',
  '.OOOO.......',
];

const BODY_DOWN_STEP_B = BODY_DOWN_STEP_A.map(r => [...r].reverse().join(''));

const BODY_UP_STAND = [
  '...OOOOOO...',
  '..OTTTTTTO..',
  '.OATTTTTTAO.',
  'OAATTTTTTAAO',
  'OAaTTTTTTaAO',
  'ORRtTTTTtRRO',
  'ORrtTTTTtrRO',
  'OHHPPPPPPHHO',
  '.OOPPPPPPOO.',
  '..OPPPPPPO..',
  '..OPPOOPPO..',
  '..OQQOOQQO..',
  '..OQqOOqQO..',
  '..OFFOOFFO..',
  '.OFFFOOFFFO.',
  '.OOOO..OOOO.',
];

const BODY_UP_STEP_A = [
  '...OOOOOO...',
  '..OTTTTTTO..',
  '.OATTTTTTAO.',
  'OAATTTTTTAAO',
  'OAaTTTTTTaAO',
  'ORRtTTTTtRRO',
  'OHHtTTTTtrRO',
  '.OOPPPPPPHHO',
  '..OPPPPPPOO.',
  '..OPPPPPPO..',
  '..OPPOOPPO..',
  '..OQQOOQQO..',
  '..OFFOOqQO..',
  '..OFFOOFFO..',
  '..OOO.OFFFO.',
  '.......OOOO.',
];

const BODY_UP_STEP_B = BODY_UP_STEP_A.map(r => [...r].reverse().join(''));

const BODY_LEFT_STAND = [
  '...OOOOO....',
  '..OTTTTTO...',
  '..OTTTTTTO..',
  '..OAAOTTTO..',
  '..OAaOTTtO..',
  '..ORrOTTtO..',
  '..ORrOTttO..',
  '..OHHOPPPO..',
  '..OOOPPPpO..',
  '...OPPPPO...',
  '...OPPPPO...',
  '...OQQQQO...',
  '...OQQqQO...',
  '..OFFFFFO...',
  '..OFGFFfO...',
  '..OOOOOOO...',
];

const BODY_LEFT_STEP_A = [
  '...OOOOO....',
  '..OTTTTTO...',
  '..OTTTTTTO..',
  '..OAAOTTTO..',
  '.OAaOTTTtO..',
  '.ORrOTTTtO..',
  'OHHOtTTttO..',
  'OOOPPPPPPO..',
  '..OPPPPPpO..',
  '..OPPOOPPO..',
  '.OPPO.OPPO..',
  '.OQQO.OQqO..',
  'OQqO..OQqO..',
  'OFFO...OFFO.',
  'OGFFO..OFfFO',
  'OOOOO..OOOOO',
];

const BODY_LEFT_STEP_B = [
  '...OOOOO....',
  '..OTTTTTO...',
  '..OTTTTTTO..',
  '..OTTOAAO...',
  '..OTTOAaO...',
  '..OTtORrO...',
  '..OttORrO...',
  '..OPPOHHO...',
  '..OPPPOOpO..',
  '..OPPOOPPO..',
  '.OPPO.OPPO..',
  '.OQqO.OQQO..',
  '.OQqO..OQqO.',
  'OFFO...OFFO.',
  'OGFfO..OFfFO',
  'OOOOO..OOOOO',
];

export const BODY: Record<Dir, readonly (readonly string[])[]> = {
  down: [BODY_DOWN_STAND, BODY_DOWN_STEP_A, BODY_DOWN_STEP_B],
  up: [BODY_UP_STAND, BODY_UP_STEP_A, BODY_UP_STEP_B],
  left: [BODY_LEFT_STAND, BODY_LEFT_STEP_A, BODY_LEFT_STEP_B],
};

export const HEAD_ORIGIN = { x: 8, y: 1 } as const;
export const BODY_ORIGIN = { x: 10, y: 15 } as const;

/** Nos passos a cabeça desce 1 px: dá o balanço da caminhada. */
export const BOB: Record<Pose, number> = { 0: 0, 1: 1, 2: 1 };

// ───────────────────────── Cabelos ─────────────────────────
// 18×17, origem 1 px acima e à esquerda da cabeça (7, 0).
// back: desenhado ATRÁS da cabeça e do corpo (cabelo comprido).
// front: desenhado por cima do rosto (franja).

export interface HairStyle {
  id: string;
  name: string;
  front: Record<Dir, readonly string[]>;
  back?: Partial<Record<Dir, readonly string[]>>;
}

export const HAIR_ORIGIN = { x: 7, y: 0 } as const;

const CURTO_DOWN = [
  '.....OOOOOOOO.....',
  '...OOYYYYYYYYOO...',
  '..OYYYZZZYYYYYYO..',
  '.OYYZZZYYYYYYYYYO.',
  '.OYZZYYYYYYYYYYyO.',
  'OYYZYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYyYYYYyYYYYyYyO',
  'OYyOyOOYOOyOOYOyyO',
  'OYyO..........OyyO',
  'OyyO..........OyyO',
  '.Oy............yO.',
  '..O............O..',
  '..................',
  '..................',
  '..................',
  '..................',
];

const CURTO_UP = [
  '.....OOOOOOOO.....',
  '...OOYYYYYYYYOO...',
  '..OYYYZZZZYYYYYO..',
  '.OYYZZZYYYYYYYYYO.',
  '.OYZZYYYYYYYYYYYO.',
  'OYYZYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYyyO',
  'OYyYYYYYYYYYYYYyyO',
  'OyyYYYYYYYYYYYyyyO',
  '.OyyyYYYYYYYYyyyO.',
  '.OOyyyyyyyyyyyyOO.',
  '...OOOOOOOOOOOO...',
  '..................',
  '..................',
  '..................',
];

const CURTO_LEFT = [
  '.....OOOOOOOO.....',
  '...OOYYYYYYYYOO...',
  '..OYYZZZYYYYYYYO..',
  '.OYZZYYYYYYYYYYYO.',
  '.OYZYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYyYyYYyYYYYYYYyyO',
  '.OOyOOyOYYYYYYyyyO',
  '.......OYYYYYyyyyO',
  '.......OYYYYYyyyO.',
  '........OyyyyyyyO.',
  '.........OOyyyyO..',
  '...........OOOO...',
  '..................',
  '..................',
  '..................',
];

const LONGO_BACK_DOWN = [
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '.OYO..........OYO.',
  '.OYyO........OyYO.',
  '.OYyO........OyYO.',
  '.OYYyO......OyYYO.',
  '.OYYyO......OyYYO.',
  '..OYyO......OyYO..',
  '..OYyO......OyYO..',
  '..OYO........OYO..',
  '...O..........O...',
];

const LONGO_FRONT_DOWN = [
  '.....OOOOOOOO.....',
  '...OOYYYYYYYYOO...',
  '..OYYYZZZYYYYYYO..',
  '.OYYZZZYYYYYYYYYO.',
  '.OYZZYYYYYYYYYYyO.',
  'OYYZYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYyYYYYYYYYyO',
  'OYYyYOOyOOYYYOyYyO',
  'OYyO..........OyYO',
  'OYyO..........OyYO',
  'OYyO..........OyYO',
  'OYyO..........OyYO',
  'OYyO..........OyYO',
  '.OO............OO.',
  '..................',
  '..................',
];

const LONGO_UP = [
  '.....OOOOOOOO.....',
  '...OOYYYYYYYYOO...',
  '..OYYYZZZZYYYYYO..',
  '.OYYZZZYYYYYYYYYO.',
  '.OYZZYYYYYYYYYYYO.',
  'OYYZYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYyyO',
  'OYyYYYYYYYYYYYYyyO',
  'OYyYYYYYYYYYYYYyyO',
  'OYyyYYYYYYYYYYyyyO',
  'OYyyYYYYYYYYYYyyyO',
  'OYyyyYYYYYYYYyyyyO',
  '.OYyyyYYYYYYyyyyO.',
  '.OYyyyyYYYYyyyyyO.',
  '..OYyyyyyyyyyyyO..',
  '..OYyyyyyyyyyyyO..',
  '...OYyyyyyyyyyO...',
  '...OYyOyyyyOyyO...',
  '....OO.OOOO.OO....',
];

const LONGO_LEFT = [
  '.....OOOOOOOO.....',
  '...OOYYYYYYYYOO...',
  '..OYYZZZYYYYYYYO..',
  '.OYZZYYYYYYYYYYYO.',
  '.OYZYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYYYYYYYYYYYYYYYyO',
  'OYyYyYYyYYYYYYYyyO',
  '.OOyOOyOYYYYYYyyyO',
  '.......OYYYYYYyyyO',
  '.......OYYYYYYyyyO',
  '.......OYYYYYYyyyO',
  '.......OYyYYYYyyyO',
  '.......OYyyYYYyyyO',
  '.......OYyyyYyyyyO',
  '.......OYyyyyyyyO.',
  '........OYyyyyyyO.',
  '........OYyOyyyO..',
  '.........OO.OOO...',
];

export const HAIR_STYLES: HairStyle[] = [
  {
    id: 'curto',
    name: 'Curto',
    front: { down: CURTO_DOWN, up: CURTO_UP, left: CURTO_LEFT },
  },
  {
    id: 'longo',
    name: 'Longo',
    front: { down: LONGO_FRONT_DOWN, up: LONGO_UP, left: LONGO_LEFT },
    back: { down: LONGO_BACK_DOWN },
  },
];
