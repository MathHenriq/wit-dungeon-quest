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

/** Repete um pedaço (tábua do píer) ao longo de `n` vezes, na vertical ou na horizontal. */
export function repeated(pm: Pixmap, n: number, vertical: boolean): Pixmap {
  const one = (p: Pixmap) => {
    const o = new Pixmap(vertical ? p.w : p.w * n, vertical ? p.h * n : p.h);
    for (let k = 0; k < n; k++) o.blit(p, vertical ? 0 : k * p.w, vertical ? k * p.h : 0);
    return o;
  };
  const o = one(pm);
  if (pm.hd) o.hd = one(pm.hd);
  return o;
}
