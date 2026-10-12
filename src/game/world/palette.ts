// Paleta do mundo: tons próprios na linha do Pokémon Emerald (verde-menta,
// contorno cinza-arroxeado) com um toque tecnológico (ciano, vidro, metal).
import { hex } from './pixmap';

export const LINE = hex('#4a4660');   // contorno de prédios e objetos
export const LINE_DARK = hex('#2e2a40');

export const GRASS = {       // tons do HeartGold/SoulSilver
  base: hex('#74d4a8'),
  tuft: hex('#5fbc93'),
  tuftDark: hex('#4ea682'),
  light: hex('#96e6c0'),
  shadow: hex('#5cb48e'),     // sombra de objeto no chão
  shadowDeep: hex('#4a9c7a'),
  rim: hex('#8a9c8a'),        // borda "levantada" da grama sobre a areia
  rimLight: hex('#a8e8c8'),
};

export const PATH = {        // areia do HGSS
  base: hex('#ecd49a'),
  shade: hex('#d6bc84'),
  edge: hex('#c4aa74'),
  light: hex('#f8e8bc'),
  pebble: hex('#cdb07a'),
};

export const PAVE = {        // calçada tecnológica
  base: hex('#d2d9e6'),
  light: hex('#e6ebf3'),
  joint: hex('#b3bcd0'),
  curb: hex('#848ca6'),
  curbLight: hex('#bcc4d6'),
  accent: hex('#a9c6e8'),
  accentDark: hex('#7aa0cc'),
  glow: hex('#8ee6f6'),
  glowSoft: hex('#c0f2fa'),
};

export const WATER = {
  base: hex('#5aa8e8'),
  deep: hex('#3c84cc'),
  light: hex('#8ccaf6'),
  foam: hex('#e4f6ff'),
  edge: hex('#2e5e94'),
  bank: hex('#6aa888'),
};

export const FOREST_FLOOR = hex('#3f6e3a');

export const TREE = {
  line: hex('#26401a'),
  dark: hex('#355f1e'),
  mid: hex('#4a8434'),
  light: hex('#72b24e'),
  hi: hex('#a4dc78'),
  trunk: hex('#8a5a34'),
  trunkDark: hex('#5c3a20'),
};

export const BLOSSOM = {      // árvore de flor (rosa)
  line: hex('#6a2a4a'),
  dark: hex('#b0487a'),
  mid: hex('#dc78a4'),
  light: hex('#f4a8c8'),
  hi: hex('#ffd8ea'),
};

export const WOOD = {
  base: hex('#c88a52'),
  light: hex('#e6b078'),
  dark: hex('#94603a'),
  line: hex('#5a3a22'),
};

export const METAL = {
  light: hex('#f4f6fc'),
  base: hex('#cdd4e2'),
  shade: hex('#a2aac0'),
  dark: hex('#747c96'),
};

export const GLASS = {
  top: hex('#c4f0ff'),
  mid: hex('#86d0f0'),
  low: hex('#5aa6dc'),
  shine: hex('#ffffff'),
};

export const NEON = {
  cyan: hex('#40e4ff'),
  cyanSoft: hex('#a8f4ff'),
  pink: hex('#ff5a9a'),
  yellow: hex('#ffe066'),
  purple: hex('#b07cff'),
};

export const WHITE = hex('#ffffff');

/** Verde da marca WIT (logo: degradê do verde escuro ao lima + quadradinhos). */
export const WIT = {
  deep: hex('#0a5a2c'),
  dark: hex('#107a38'),
  base: hex('#23964a'),
  mid: hex('#4cb048'),
  lime: hex('#8cc63f'),
  limeLight: hex('#c4e47a'),
};

/** Cores de luz para a noite (camada que acende por cima do escuro). */
export const LED = {
  green: hex('#9cff5a'),
  greenSoft: hex('#e2ffb8'),
  warm: hex('#ffd878'),
  warmSoft: hex('#fff2c4'),
  cyan: hex('#6cf0ff'),
  pink: hex('#ff7ab8'),
  purple: hex('#c89cff'),
  orange: hex('#ffae5a'),
  white: hex('#fffcf0'),
};

/** Rampas de telhado: claro (topo das tábuas), base, listra, beiral. */
export const ROOFS = {
  laranja: { top: hex('#fcc898'), base: hex('#ee9a6c'), stripe: hex('#d06a4a'), eave: hex('#a84436') },
  vermelho: { top: hex('#fca8a0'), base: hex('#e86468'), stripe: hex('#c0404e'), eave: hex('#8c2a3c') },
  azul: { top: hex('#b8dcfc'), base: hex('#74a4e8'), stripe: hex('#4e78c4'), eave: hex('#34508e') },
  verde: { top: hex('#c4ecac'), base: hex('#84c46a'), stripe: hex('#5a9a48'), eave: hex('#3c6e34') },
  roxo: { top: hex('#dcc4fc'), base: hex('#a88ae4'), stripe: hex('#7e60c0'), eave: hex('#56408e') },
  rosa: { top: hex('#ffd0e4'), base: hex('#f49ac0'), stripe: hex('#d46a9a'), eave: hex('#9c4470') },
  grafite: { top: hex('#b8bed0'), base: hex('#7c849c'), stripe: hex('#5c6480'), eave: hex('#3c4260') },
} as const;
export type RoofColor = keyof typeof ROOFS;

export const WALLS = {
  cinza: { hi: hex('#ffffff'), base: hex('#dfe6f2'), shade: hex('#b4bed4'), line: hex('#98a2bc') },
  creme: { hi: hex('#fffaec'), base: hex('#f2e4c4'), shade: hex('#d6c29c'), line: hex('#b8a27c') },
  rosa: { hi: hex('#fff4f8'), base: hex('#f8dce6'), shade: hex('#dcb4c4'), line: hex('#c094a8') },
  menta: { hi: hex('#f4fffa'), base: hex('#d4f0e4'), shade: hex('#a8d4c0'), line: hex('#88b8a4') },
} as const;
export type WallColor = keyof typeof WALLS;
