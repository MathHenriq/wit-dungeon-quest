// Movimento da cidade feito a partir da própria arte: balanço de árvores e
// plantas com o vento. Os quadros saem em hd (onde meio pixel do mundo já é
// um movimento visível e suave); na resolução normal a arte fica parada.
import { Pixmap } from './pixmap';

const cache = new WeakMap<Pixmap, Map<string, Pixmap[]>>();

/**
 * Quadros de balanço: as linhas acima de `pivot` (fração da altura, 0–1)
 * deslizam para os lados, mais no topo, até `amp` pixels hd, num ciclo de
 * `n` quadros. A base não se mexe. Os quadros são guardados por arte (várias
 * árvores iguais usam os mesmos).
 */
export function swayFrames(pm: Pixmap, amp: number, pivot = 0.75, n = 8): Pixmap[] {
  const key = `${amp}|${pivot}|${n}`;
  let byKey = cache.get(pm);
  if (!byKey) { byKey = new Map(); cache.set(pm, byKey); }
  const hit = byKey.get(key);
  if (hit) return hit;
  const src = pm.hd;
  const frames: Pixmap[] = [];
  for (let f = 0; f < n; f++) {
    const one = new Pixmap(pm.w, pm.h);
    one.data.set(pm.data);
    if (src) {
      const hd = new Pixmap(src.w, src.h);
      const wave = Math.sin((2 * Math.PI * f) / n);
      const py = Math.round(src.h * pivot);
      for (let y = 0; y < src.h; y++) {
        const t = y < py ? (py - y) / py : 0;
        const off = Math.round(amp * wave * Math.pow(t, 1.3));
        const row = y * src.w * 4;
        if (off === 0) { hd.data.set(src.data.subarray(row, row + src.w * 4), row); continue; }
        for (let x = 0; x < src.w; x++) {
          const sx = x - off;
          if (sx < 0 || sx >= src.w) continue;
          const i = row + sx * 4, o = row + x * 4;
          hd.data[o] = src.data[i]; hd.data[o + 1] = src.data[i + 1]; hd.data[o + 2] = src.data[i + 2]; hd.data[o + 3] = src.data[i + 3];
        }
      }
      one.hd = hd;
    }
    frames.push(one);
  }
  byKey.set(key, frames);
  return frames;
}
