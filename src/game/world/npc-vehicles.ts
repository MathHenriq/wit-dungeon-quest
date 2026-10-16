// Carro e moto dos moradores (Valton de carro, Lucatto, Dante e Wellington de moto).
// Arte por código em scripts/arte/veiculos.py → public/game/sprites/veiculos/<id>.png:
// 4 linhas (frente, esquerda, direita, costas) × 2 colunas (fundo com o vidro; a
// frente que tapa o motorista). Desenho: fundo → motorista da cintura para cima →
// frente. O banco (meio do motorista e linha da cintura) vem no manifest.
import type { Dir } from './movement';
import { drawSeated, R, type Frames } from './sprites';
import { MODEL_ROWS } from './model-sprite';

export interface RideMeta { cx: number; cintura: number }
export interface RideArt {
  /** Quadro em px da folha (hd). */
  cw: number; ch: number;
  base: Record<Dir, HTMLCanvasElement>;
  front: Record<Dir, HTMLCanvasElement>;
  meta: Record<Dir, RideMeta>;
}

/** Mais rápido que a pé (ms por bloco); só anda em rua, calçada, terra, praça e ponte. */
export const RIDE_MS = { carro: 95, moto: 115 } as const;

const base = () => `${import.meta.env.BASE_URL}game/sprites/veiculos`;
let manifest: Promise<Record<string, { cell: [number, number] } & Record<Dir, RideMeta>>> | null = null;
const cache = new Map<string, Promise<RideArt>>();

function img(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export function loadRide(id: string): Promise<RideArt> {
  let p = cache.get(id);
  if (!p) {
    manifest ??= fetch(`${base()}/manifest.json`).then(r => r.json());
    p = Promise.all([manifest, img(`${base()}/${id}.png`)]).then(([m, im]) => {
      const def = m[id];
      const [cw, ch] = def.cell;
      const cut = (col: number, row: number) => {
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        c.getContext('2d')!.drawImage(im, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
        return c;
      };
      const out = { cw, ch, base: {}, front: {}, meta: {} } as RideArt;
      MODEL_ROWS.forEach((d, r) => { out.base[d] = cut(0, r); out.front[d] = cut(1, r); out.meta[d] = def[d]; });
      return out;
    });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

/**
 * Desenha o veículo com o motorista. `cx` = meio do bloco e `fy` = chão (px da
 * tela); o veículo fica centrado e encostado no chão.
 */
export function drawRide(ctx: CanvasRenderingContext2D, art: RideArt, driver: Frames | null, dir: Dir, cx: number, fy: number, bob = 0) {
  const w = art.cw / R, h = art.ch / R;
  const x0 = Math.round(cx - w / 2), y0 = Math.round(fy - h + bob);
  ctx.drawImage(art.base[dir], x0, y0, w, h);
  if (driver) {
    const m = art.meta[dir], im = driver.walk[dir][0];
    drawSeated(ctx, im, Math.round(x0 + m.cx / R - driver.w / 2), y0 + m.cintura / R, driver.waist[dir]);
  }
  ctx.drawImage(art.front[dir], x0, y0, w, h);
}
