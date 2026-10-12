// Troca de cor de cabelo, camiseta e bermuda no boneco base (sprites da
// PixelLab), pixel a pixel. Funciona em qualquer quadro (parado ou andando).

type Ramp = readonly string[];

export const HAIR_RAMPS: Record<string, Ramp> = {
  castanho: [], // cor original
  preto: ['#14121c', '#262236', '#3a3450', '#565070', '#6a6488'],
  loiro: ['#6a4a18', '#c89a3c', '#ecc462', '#fce49a', '#fff4c8'],
  rosa: ['#6a2046', '#c85a8c', '#ec8cb4', '#fcc0d8', '#ffe0ec'],
  azul: ['#18285a', '#3456a6', '#5a82d6', '#94b4f4', '#c4d8ff'],
  ruivo: ['#4a1a0e', '#9a3a1a', '#c85a28', '#ec8a44', '#f8b070'],
  lilas: ['#3a2266', '#6c4aac', '#9a78d6', '#c8b0f4', '#e4d8ff'],
  verde: ['#1e3a14', '#3e7a2c', '#62a848', '#94d474', '#c4f0a4'],
};

export const CLOTH_RAMPS: Record<string, Ramp> = {
  branco: [],
  vermelho: ['#4a1018', '#a4283a', '#d8404e', '#f07078'],
  verde: ['#12361e', '#2a7440', '#44a45a', '#7ccc84'],
  amarelo: ['#5a3c0c', '#c8901c', '#f0bc30', '#fce070'],
  marinho: ['#0c1430', '#1c2c5c', '#2c4486', '#4a66ae'],
  roxo: ['#2e1c54', '#6444a4', '#8c6cd0', '#bca4f0'],
  rosa: ['#5a1a3c', '#c04c84', '#e880b0', '#fcb4d4'],
  preto: ['#0c0c14', '#1e1e2c', '#30303e', '#4a4a5c'],
  jeans: ['#141e3a', '#2c4070', '#40609c', '#6484bc'],
  caqui: ['#3e3018', '#8a7040', '#b4945c', '#d4b884'],
  cinza: [],
};

export interface Outfit { hair: string; top: string; bottom: string }

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2;
  let h = 0, s = 0;
  if (M !== m) {
    const d = M - m;
    s = l > 0.5 ? d / (2 - M - m) : d / (M + m);
    h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

const pick = (ramp: Ramp, t: number) => hexRgb(ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))]);

/**
 * Recolore os pixels RGBA de um quadro 32×32 do boneco base.
 * Cabelo: tons marrons na parte de cima. Camiseta: brancos azulados no
 * tronco. Bermuda: cinzas na parte de baixo.
 */
export function recolorBase(data: Uint8ClampedArray, width: number, o: Outfit): void {
  const hair = HAIR_RAMPS[o.hair] ?? [], top = CLOTH_RAMPS[o.top] ?? [], bottom = CLOTH_RAMPS[o.bottom] ?? [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const y = Math.floor(i / 4 / width);
    const [h, s, l] = hsl(data[i], data[i + 1], data[i + 2]);
    if (l < 0.1) continue;
    let c: [number, number, number] | null = null;
    if (hair.length && y <= 15 && h >= 12 && h < 45 && s > 0.25 && l < 0.62 && l > 0.12) c = pick(hair, (l - 0.12) / 0.5);
    else if (top.length && y >= 14 && y <= 24 && l >= 0.6 && ((h >= 200 && h <= 265) || s < 0.12)) c = pick(top, (l - 0.6) / 0.41);
    else if (bottom.length && y >= 21 && s < 0.2 && l > 0.25 && l <= 0.55) c = pick(bottom, (l - 0.25) / 0.3);
    if (c) { data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; }
  }
}
