// Rampas de cor do boneco. Cada rampa tem 4 tons: contorno, sombra, base, luz.
// O desenho (base.ts) marca regiões ("pele", "roupa de cima"...), nunca cores:
// trocar a rampa troca a cor da peça inteira, e é daí que vem a variedade.

export type Ramp = readonly [outline: string, shade: string, base: string, light: string];

export const SKIN_TONES: Record<string, Ramp> = {
  porcelana: ['#8a5a4a', '#e8b8a0', '#fcdcc8', '#fff0e4'],
  clara:     ['#83503c', '#dca07c', '#f4c4a0', '#fce0c4'],
  pessego:   ['#7a4632', '#c98a60', '#e8ac80', '#f6c8a0'],
  morena:    ['#63341f', '#a86a44', '#c98c5c', '#e0aa78'],
  canela:    ['#4a2616', '#86502e', '#a86c40', '#c48a58'],
  escura:    ['#2e1810', '#5c3420', '#7a4a2c', '#96623c'],
};

export const HAIR_COLORS: Record<string, Ramp> = {
  preto:    ['#14121c', '#262236', '#3a3450', '#565070'],
  castanho: ['#2a1810', '#4e2e1c', '#6e4428', '#946038'],
  ruivo:    ['#4a1a0e', '#9a3a1a', '#c85a28', '#ec8a44'],
  loiro:    ['#6a4a18', '#c89a3c', '#ecc462', '#fce49a'],
  rosa:     ['#6a2046', '#c85a8c', '#ec8cb4', '#fcc0d8'],
  azul:     ['#18285a', '#3456a6', '#5a82d6', '#94b4f4'],
  lilas:    ['#3a2266', '#6c4aac', '#9a78d6', '#c8b0f4'],
  branco:   ['#5a5a70', '#b4b4c8', '#dcdcec', '#ffffff'],
};

export const CLOTH_COLORS: Record<string, Ramp> = {
  vermelho: ['#4a1018', '#a4283a', '#d8404e', '#f07078'],
  azul:     ['#142250', '#2a4aa0', '#4070d0', '#78a4f0'],
  verde:    ['#12361e', '#2a7440', '#44a45a', '#7ccc84'],
  amarelo:  ['#5a3c0c', '#c8901c', '#f0bc30', '#fce070'],
  rosa:     ['#5a1a3c', '#c04c84', '#e880b0', '#fcb4d4'],
  lilas:    ['#2e1c54', '#6444a4', '#8c6cd0', '#bca4f0'],
  branco:   ['#4a4a5c', '#b0b0c4', '#e4e4f0', '#ffffff'],
  preto:    ['#0c0c14', '#1e1e2c', '#30303e', '#4a4a5c'],
  jeans:    ['#141e3a', '#2c4070', '#40609c', '#6484bc'],
  caqui:    ['#3e3018', '#8a7040', '#b4945c', '#d4b884'],
};

export const EYE_COLORS: Record<string, Ramp> = {
  escuro:   ['#14101c', '#14101c', '#2a2238', '#ffffff'],
  castanho: ['#1c1008', '#1c1008', '#5a3418', '#ffffff'],
  azul:     ['#0c1a3a', '#0c1a3a', '#2c5cb4', '#ffffff'],
  verde:    ['#0c2a16', '#0c2a16', '#2c8a4a', '#ffffff'],
};

/** Contorno usado quando o pixel de contorno não encosta em nenhuma região. */
export const DEFAULT_OUTLINE = '#221a2c';
