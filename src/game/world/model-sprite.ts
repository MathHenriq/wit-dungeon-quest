// Quadros do personagem no navegador: carrega a folha do modelo (4 × 4) e
// devolve os canvases já pintados com o visual escolhido.
import { applyLook, MODEL_CELL, type Look } from './outfit';

const sheets = new Map<string, Promise<HTMLImageElement>>();

export function loadModelSheet(modelo: string): Promise<HTMLImageElement> {
  let p = sheets.get(modelo);
  if (!p) {
    p = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = `/game/sprites/modelos/${modelo}.png`;
    });
    p.catch(() => sheets.delete(modelo));
    sheets.set(modelo, p);
  }
  return p;
}

/** Ordem das linhas na folha. */
export const MODEL_ROWS = ['south', 'west', 'east', 'north'] as const;

/** 4 linhas × 4 quadros (parado, pé esquerdo, parado, pé direito). */
export function paintModel(img: HTMLImageElement, look: Look): HTMLCanvasElement[][] {
  const { w, h } = MODEL_CELL;
  const full = document.createElement('canvas');
  full.width = img.width; full.height = img.height;
  const fx = full.getContext('2d', { willReadFrequently: true })!;
  fx.drawImage(img, 0, 0);
  const d = fx.getImageData(0, 0, full.width, full.height);
  applyLook(d.data, look);
  fx.putImageData(d, 0, 0);
  return MODEL_ROWS.map((_, r) => [0, 1, 2, 3].map(c => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d')!.drawImage(full, c * w, r * h, w, h, 0, 0, w, h);
    return cv;
  }));
}

export async function modelFrames(look: Look): Promise<HTMLCanvasElement[][]> {
  return paintModel(await loadModelSheet(look.modelo), look);
}
