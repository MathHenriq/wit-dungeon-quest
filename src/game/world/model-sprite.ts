// Quadros do personagem no navegador: carrega a folha do modelo (4 × 4) e
// devolve os canvases já pintados com o visual escolhido.
import { applyLook, CLOTH, MODEL_CELL, type Look } from './outfit';
import {
  ACC_INFO, DEFAULT_ACC_COLOR, loadAccessories, measureFrames, placeAcc, tintGray, type AccAssets,
} from './accessories';

const sheets = new Map<string, Promise<HTMLImageElement>>();

export function loadModelSheet(modelo: string): Promise<HTMLImageElement> {
  let p = sheets.get(modelo);
  if (!p) {
    p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = `${import.meta.env.BASE_URL}game/sprites/modelos/${modelo}.png`;
    });
    p.catch(() => sheets.delete(modelo));
    sheets.set(modelo, p);
  }
  return p;
}

/** Ordem das linhas na folha. */
export const MODEL_ROWS = ['south', 'west', 'east', 'north'] as const;

/** 4 linhas × 4 quadros (parado, pé esquerdo, parado, pé direito). */
export function paintModel(img: HTMLImageElement, look: Look, acc?: AccAssets | null): HTMLCanvasElement[][] {
  const { w, h } = MODEL_CELL;
  const full = document.createElement('canvas');
  full.width = img.width; full.height = img.height;
  const fx = full.getContext('2d', { willReadFrequently: true })!;
  fx.drawImage(img, 0, 0);
  const d = fx.getImageData(0, 0, full.width, full.height);
  // mede cabeça e tronco antes de pintar (pelas cores-molde)
  const worn = acc && look.acc ? Object.values(look.acc).filter(v => v && acc.manifest[v.id]) : [];
  const bodies = worn.length ? measureFrames(d.data, full.width, w, h) : [];
  applyLook(d.data, look);
  fx.putImageData(d, 0, 0);
  // cada acessório pintado na cor dele, uma vez (4 direções)
  const pieces = worn.map(v => {
    const def = acc!.manifest[v!.id];
    return {
      id: v!.id,
      dirs: def.a.map(([ax, ay, aw, ah]) => {
        const c = document.createElement('canvas');
        c.width = aw; c.height = ah;
        const x = c.getContext('2d', { willReadFrequently: true })!;
        x.drawImage(acc!.atlas, ax, ay, aw, ah, 0, 0, aw, ah);
        if (!def.fixo) {
          const id = x.getImageData(0, 0, aw, ah);
          tintGray(id.data, CLOTH[v!.cor ?? DEFAULT_ACC_COLOR] ?? CLOTH[DEFAULT_ACC_COLOR]);
          x.putImageData(id, 0, 0);
        }
        return c;
      }),
    };
  });
  // corpo primeiro, depois cabeça e rosto por cima (óculos por cima do chapéu não)
  const order = { corpo: 0, cabeca: 1, rosto: 2 } as const;
  pieces.sort((a, b) => order[ACC_INFO[a.id].slot] - order[ACC_INFO[b.id].slot]);
  return MODEL_ROWS.map((_, r) => [0, 1, 2, 3].map(c => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const x = cv.getContext('2d')!;
    const put = (behind: boolean) => {
      for (const p of pieces) {
        const src = p.dirs[r], pos = placeAcc(p.id, r, bodies[r * 4 + c], src.width, src.height);
        if (!pos.hidden && pos.behind === behind) x.drawImage(src, pos.x, pos.y, Math.round(src.width * pos.scale), Math.round(src.height * pos.scale));
      }
    };
    put(true);
    x.drawImage(full, c * w, r * h, w, h, 0, 0, w, h);
    // boné/chapéu: o cabelo acima da aba fica dentro dele (senão o boné "flutua" em cima do topete)
    for (const p of pieces) {
      const src = p.dirs[r], pos = placeAcc(p.id, r, bodies[r * 4 + c], src.width, src.height);
      if (!pos.hidden && pos.clearAbove !== undefined) x.clearRect(0, 0, w, Math.max(0, pos.clearAbove));
    }
    put(false);
    return cv;
  }));
}

const waists = new Map<string, Promise<number[]>>();
/**
 * Cintura de cada direção do modelo (px do mundo, do topo do quadro): a
 * última linha da camisa (cor-molde) mais 1, medida no quadro parado.
 */
export function modelWaists(modelo: string): Promise<number[]> {
  let p = waists.get(modelo);
  if (!p) {
    p = loadModelSheet(modelo).then(img => {
      const { w, h } = MODEL_CELL;
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true })!;
      x.drawImage(img, 0, 0);
      const bodies = measureFrames(x.getImageData(0, 0, c.width, c.height).data, c.width, w, h);
      return MODEL_ROWS.map((_, r) => Math.round(bodies[r * 4].torsoBottom / 2) + 1);
    });
    waists.set(modelo, p);
  }
  return p;
}

export async function modelFrames(look: Look): Promise<HTMLCanvasElement[][]> {
  const [img, acc] = await Promise.all([
    loadModelSheet(look.modelo),
    look.acc ? loadAccessories().catch(() => null) : Promise.resolve(null),
  ]);
  return paintModel(img, look, acc);
}
