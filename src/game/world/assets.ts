// Sprites prontos (convertidos das imagens do GPT por
// scripts/arte/importar-gpt.py) em public/game/world: cada um com a arte de
// dia e, quando tem, a camada da noite. Sem eles a cidade usa a arte feita
// por código (é o que os testes usam).
import { hex, mix, Pixmap, type RGB } from './pixmap';
import { LED } from './palette';

export interface Sprite { pix: Pixmap; night?: Pixmap }
export type WorldAssets = Record<string, Sprite>;
export interface ManifestEntry { w: number; h: number; noite?: boolean }

export function pixmapFromRGBA(w: number, h: number, data: Uint8ClampedArray | Uint8Array): Pixmap {
  const pm = new Pixmap(w, h);
  pm.data.set(data);
  return pm;
}

/** Carrega no navegador (manifest + PNGs), com a versão hd (2×) de cada sprite. */
export async function loadWorldAssets(base = `${import.meta.env.BASE_URL}game/world`, hd = true): Promise<WorldAssets> {
  const [normal, big] = await Promise.all([loadDir(base), hd ? loadDir(`${base}/hd`).catch(() => null) : Promise.resolve(null)]);
  if (big) attachHd(normal, big);
  return normal;
}

/**
 * Chão da cidade já pintado em hd (gerado por scripts/mapa/chao-pronto.ts),
 * com a chave da planta. Sem ele (ou com erro), undefined: a cidade calcula.
 */
export async function loadPrebuiltGround(base = `${import.meta.env.BASE_URL}game/world/cidade`): Promise<{ pix: Pixmap; key: string } | undefined> {
  try {
    const info: { key: string } = await (await fetch(`${base}/chao.json`)).json();
    const img = new Image();
    img.src = `${base}/chao.webp`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    return { pix: pixmapFromRGBA(img.width, img.height, ctx.getImageData(0, 0, img.width, img.height).data), key: info.key };
  } catch {
    return undefined;
  }
}

/** Pendura em cada sprite a versão hd de mesmo nome (e a da noite). */
export function attachHd(normal: WorldAssets, big: WorldAssets): void {
  for (const [name, s] of Object.entries(normal)) {
    const b = big[name];
    if (!b) continue;
    s.pix.hd = b.pix;
    if (s.night && b.night) s.night.hd = b.night;
    else if (s.night) s.night.hd = upscale(s.night);
  }
}

/** Ampliação 2× sem suavizar (cada pixel vira 2 × 2). */
export function upscale(pm: Pixmap): Pixmap {
  const out = new Pixmap(pm.w * 2, pm.h * 2);
  const s = pm.data, d = out.data;
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    const i = ((y >> 1) * pm.w + (x >> 1)) * 4, o = (y * out.w + x) * 4;
    d[o] = s[i]; d[o + 1] = s[i + 1]; d[o + 2] = s[i + 2]; d[o + 3] = s[i + 3];
  }
  return out;
}

/** A arte hd de uma imagem (a própria, ou a normal ampliada). */
export function hdOf(pm: Pixmap): Pixmap {
  return pm.hd ?? upscale(pm);
}

async function loadDir(base: string): Promise<WorldAssets> {
  const manifest: Record<string, ManifestEntry> = await (await fetch(`${base}/manifest.json`)).json();
  const read = (src: string) => new Promise<Pixmap>((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      res(pixmapFromRGBA(img.width, img.height, ctx.getImageData(0, 0, img.width, img.height).data));
    };
    img.onerror = rej;
    img.src = src;
  });
  const out: WorldAssets = {};
  await Promise.all(Object.entries(manifest).map(async ([name, m]) => {
    const [pix, night] = await Promise.all([read(`${base}/${name}.png`), m.noite ? read(`${base}/${name}-noite.png`) : Promise.resolve(undefined)]);
    out[name] = { pix, night };
  }));
  return out;
}

/** Cópia da arte com margem transparente até (w × h), arte centrada embaixo. */
export function padTo(pm: Pixmap, w: number, h: number): Pixmap {
  if (pm.w === w && pm.h === h) return pm;
  const out = new Pixmap(Math.max(w, pm.w), Math.max(h, pm.h));
  const left = (out.w - pm.w) >> 1;
  out.blit(pm, left, out.h - pm.h);
  if (pm.hd) {
    out.hd = new Pixmap(out.w * 2, out.h * 2);
    out.hd.blit(pm.hd, left * 2, (out.h - pm.h) * 2);
  }
  return out;
}

/** Acrescenta à noite os pixels claros das `rows` primeiras linhas (a cúpula de um poste). */
export function lampNight(s: Sprite, rows: number): Pixmap {
  const one = (pix: Pixmap, night: Pixmap | undefined, r: number) => {
    const nt = new Pixmap(pix.w, pix.h);
    if (night) nt.data.set(night.data);
    for (let y = 0; y < Math.min(r, pix.h); y++) for (let x = 0; x < pix.w; x++) {
      const c = pix.get(x, y);
      if (c && c[0] + c[1] + c[2] > 560) nt.put(x, y, mix(LED.warmSoft, LED.white, 0.4));
    }
    return nt;
  };
  const nt = one(s.pix, s.night, rows);
  if (s.pix.hd) nt.hd = one(s.pix.hd, s.night?.hd, rows * 2);
  return nt;
}

/** Quadros de água cintilando (pixels azuis ganham brilhos que mudam). */
export function waterFrames(s: Sprite, n = 3): Sprite[] {
  const frames = waterFrames1(s, n);
  if (s.pix.hd) {
    const big = waterFrames1({ pix: s.pix.hd, night: s.night?.hd }, n);
    frames.forEach((f, i) => { f.pix.hd = big[i].pix; f.night!.hd = big[i].night; });
  }
  return frames;
}

function waterFrames1(s: Sprite, n: number): Sprite[] {
  const isWater = (c: RGB | null) => !!c && c[2] > 170 && c[2] > c[0] + 50 && c[1] > 120;
  const frames: Sprite[] = [];
  for (let f = 0; f < n; f++) {
    const pm = new Pixmap(s.pix.w, s.pix.h);
    pm.data.set(s.pix.data);
    const nt = new Pixmap(s.pix.w, s.pix.h);
    if (s.night) nt.data.set(s.night.data);
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const c = s.pix.get(x, y);
      if (!isWater(c)) continue;
      const k = (x * 7 + y * 13 + f * 17) % 23;
      if (k === 0) pm.put(x, y, hex('#f0fbff'));
      else if (k === 1) pm.put(x, y, mix(c!, hex('#ffffff'), 0.5));
      if ((x * 5 + y * 11 + f * 7) % 9 === 0) nt.put(x, y, mix(c!, hex('#8ce8ff'), 0.5));
    }
    frames.push({ pix: pm, night: nt });
  }
  return frames;
}

/**
 * Acha o retângulo da placa lisa de uma arte (o maior trecho de pixels
 * parecidos com `ref`), para escrever o texto por cima.
 */
export function findPlaque(pm: Pixmap, isPlaque: (c: RGB) => boolean): { x0: number; y0: number; x1: number; y1: number } | null {
  let best: { x0: number; y0: number; x1: number; y1: number } | null = null;
  let bestArea = 0;
  const seen = new Uint8Array(pm.w * pm.h);
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (seen[i]) continue;
    const c = pm.get(x, y);
    if (!c || !isPlaque(c)) continue;
    const q = [i]; seen[i] = 1;
    let x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
    while (q.length) {
      const j = q.pop()!, jx = j % pm.w, jy = (j / pm.w) | 0;
      n++;
      x0 = Math.min(x0, jx); x1 = Math.max(x1, jx); y0 = Math.min(y0, jy); y1 = Math.max(y1, jy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = jx + dx, ny = jy + dy;
        if (nx < 0 || ny < 0 || nx >= pm.w || ny >= pm.h) continue;
        const k = ny * pm.w + nx;
        if (seen[k]) continue;
        const cc = pm.get(nx, ny);
        if (!cc || !isPlaque(cc)) continue;
        seen[k] = 1; q.push(k);
      }
    }
    if (n > bestArea) { bestArea = n; best = { x0, y0, x1, y1 }; }
  }
  return best;
}
