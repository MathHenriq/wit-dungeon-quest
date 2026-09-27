// Visual do personagem: um dos 10 modelos-base (public/game/sprites/modelos,
// gerados por scripts/arte/importar-personagem.py) + cor de pele, cabelo,
// parte de cima e parte de baixo. Os modelos vêm pintados numa paleta fixa
// (4 tons por parte); aqui cada tom vira o tom correspondente da rampa escolhida.

export type Ramp = readonly [string, string, string, string];

/** Paleta dos PNGs dos modelos: tem de ser igual à PALETTE do script. */
export const MOLDE = {
  hair: ['#0e5a66', '#1a8a9a', '#24b4c8', '#7ae0ee'],
  top: ['#1c6a28', '#2c9038', '#3cb44a', '#86dc8e'],
  bottom: ['#1a2c74', '#26409c', '#3456c8', '#7890e8'],
  skin: ['#a8704c', '#d0946c', '#e8b48c', '#f8d4b4'],
} as const;

export const MODELOS = [
  'modelo-01', 'modelo-02', 'modelo-03', 'modelo-04', 'modelo-05',
  'modelo-06', 'modelo-07', 'modelo-08', 'modelo-09', 'modelo-10',
] as const;

export const SKIN: Record<string, Ramp> = {
  'pele-1': ['#c8987c', '#e8bca0', '#f8d8c4', '#fff0e4'],
  'pele-2': ['#b8845c', '#d8a47c', '#f0c49c', '#fcdcbc'],
  'pele-3': ['#a8704c', '#d0946c', '#e8b48c', '#f8d4b4'],
  'pele-4': ['#8a5434', '#b07448', '#c89060', '#e0b080'],
  'pele-5': ['#5e3620', '#84502e', '#a06a40', '#bc8858'],
  'pele-6': ['#3a2014', '#54321e', '#6e442a', '#8a5c3c'],
};

export const HAIR: Record<string, Ramp> = {
  castanho: ['#3a2010', '#6a4020', '#94602e', '#c08a4a'],
  preto: ['#14121c', '#262236', '#3a3450', '#5a5474'],
  loiro: ['#8a6424', '#c89a3c', '#e8c464', '#f8e4a0'],
  ruivo: ['#5a200e', '#9a3a1a', '#c85a28', '#ec8a44'],
  rosa: ['#7a2a52', '#b84c7c', '#dc7ca4', '#f4b0cc'],
  azul: ['#1c2c64', '#3456a6', '#5a82d6', '#94b4f4'],
  lilas: ['#3a2266', '#6c4aac', '#9474d0', '#c0a8ec'],
  verde: ['#1e3a14', '#3e7a2c', '#62a848', '#94d474'],
};

export const CLOTH: Record<string, Ramp> = {
  verde: ['#12361e', '#2a7440', '#44a45a', '#7ccc84'],
  vermelho: ['#4a1018', '#a4283a', '#d8404e', '#f07078'],
  amarelo: ['#6a4a0c', '#c8901c', '#f0bc30', '#fce070'],
  marinho: ['#0c1430', '#1c2c5c', '#2c4486', '#4a66ae'],
  roxo: ['#2e1c54', '#6444a4', '#8c6cd0', '#bca4f0'],
  rosa: ['#5a1a3c', '#c04c84', '#e880b0', '#fcb4d4'],
  laranja: ['#5a2408', '#c05a18', '#ec8030', '#fcb46c'],
  branco: ['#7a8090', '#b4bccc', '#dce2ec', '#f6f8fc'],
  preto: ['#0c0c14', '#1e1e2c', '#30303e', '#4a4a5c'],
  jeans: ['#141e3a', '#2c4070', '#40609c', '#6484bc'],
  caqui: ['#3e3018', '#8a7040', '#b4945c', '#d4b884'],
};

export interface Look {
  modelo: string;
  pele: string;
  cabelo: string;
  cima: string;
  baixo: string;
}

export const DEFAULT_LOOK: Look = { modelo: 'modelo-01', pele: 'pele-3', cabelo: 'castanho', cima: 'verde', baixo: 'jeans' };

/** Junta com o padrão e descarta valores que não existem (visual salvo antigo). */
export function normalizeLook(l: Partial<Look> | null | undefined): Look {
  const ok = <T extends string>(v: string | undefined, table: Record<string, unknown> | readonly string[], d: T) =>
    v && (Array.isArray(table) ? table.includes(v) : v in table) ? v : d;
  return {
    modelo: ok(l?.modelo, MODELOS, DEFAULT_LOOK.modelo),
    pele: ok(l?.pele, SKIN, DEFAULT_LOOK.pele),
    cabelo: ok(l?.cabelo, HAIR, DEFAULT_LOOK.cabelo),
    cima: ok(l?.cima, CLOTH, DEFAULT_LOOK.cima),
    baixo: ok(l?.baixo, CLOTH, DEFAULT_LOOK.baixo),
  };
}

const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const key = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;

/** Troca, no RGBA de um modelo, cada tom da paleta-molde pelo tom da rampa. */
export function applyLook(data: Uint8ClampedArray | Uint8Array, look: Look): void {
  const map = new Map<number, number[]>();
  const add = (from: readonly string[], to: Ramp) => from.forEach((c, i) => { const [r, g, b] = rgb(c); map.set(key(r, g, b), rgb(to[i])); });
  add(MOLDE.hair, HAIR[look.cabelo]);
  add(MOLDE.top, CLOTH[look.cima]);
  add(MOLDE.bottom, CLOTH[look.baixo]);
  add(MOLDE.skin, SKIN[look.pele]);
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const to = map.get(key(data[i], data[i + 1], data[i + 2]));
    if (to) { data[i] = to[0]; data[i + 1] = to[1]; data[i + 2] = to[2]; }
  }
}

/** Tamanho de cada quadro na folha do modelo e a linha dos pés. */
export const MODEL_CELL = { w: 32, h: 40, foot: 38 } as const;
