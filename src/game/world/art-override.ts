// Sprites do GPT que substituem a arte feita por código, pelo nome (a lista
// está em art-list.ts). As áreas passam os sprites para cá ao montar; o que
// é desenhado fora da planta (plantas, peixes, bichos, barco, drone) consulta
// aqui antes de desenhar por código.
import type { Sprite, WorldAssets } from './assets';
import { Pixmap } from './pixmap';

let art: WorldAssets = {};

export function setWorldArt(a: WorldAssets | undefined): void { art = a ?? {}; }
export function worldArt(name: string): Sprite | undefined { return art[name]; }

/** Espelhado na horizontal (com a hd junto). */
export function mirrored(pm: Pixmap): Pixmap {
  const f1 = (p: Pixmap) => { const o = new Pixmap(p.w, p.h); o.blit(p, 0, 0, true); return o; };
  const o = f1(pm);
  if (pm.hd) o.hd = f1(pm.hd);
  return o;
}

/**
 * Gira a arte em volta do centro (vizinho mais próximo, sem suavizar), com a
 * hd junto. Usado nas pás do moinho do GPT.
 */
export function rotated(pm: Pixmap, ang: number): Pixmap {
  const one = (p: Pixmap) => {
    const o = new Pixmap(p.w, p.h), c = Math.cos(-ang), s = Math.sin(-ang), cx = p.w / 2, cy = p.h / 2;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const sx = Math.floor(cx + dx * c - dy * s), sy = Math.floor(cy + dx * s + dy * c);
      const px = p.get(sx, sy);
      if (px) o.put(x, y, px);
    }
    return o;
  };
  const o = one(pm);
  if (pm.hd) o.hd = one(pm.hd);
  return o;
}

/**
 * Repete um pedaço (tábua do píer) até cobrir `n` blocos, na vertical ou na
 * horizontal, e corta no tamanho exato (o pedaço pode ter mais de 1 bloco:
 * repetir 1 vez por bloco deixava o píer com o dobro do comprimento).
 */
export function repeated(pm: Pixmap, n: number, vertical: boolean): Pixmap {
  const one = (p: Pixmap, unit: number) => {
    const len = n * unit, step = vertical ? p.h : p.w;
    const o = new Pixmap(vertical ? p.w : len, vertical ? len : p.h);
    for (let at = 0; at < len; at += step) o.blit(p, vertical ? 0 : at, vertical ? at : 0);
    return o;
  };
  const o = one(pm, 16);
  if (pm.hd) o.hd = one(pm.hd, 32);
  return o;
}
