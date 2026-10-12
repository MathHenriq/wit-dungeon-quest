// Quadros de personagens e utilitários de canvas usados pela cidade e pelos
// interiores. Toda arte em canvas está em hd (R pixels por pixel do mundo).
import type { Dir } from './movement';
import { MODEL_CELL, type Look } from './outfit';
import { MODEL_ROWS, modelFrames, modelWaists } from './model-sprite';
import { nameplate, type PlateStyle } from './nameplate';
import type { Pixmap } from './pixmap';

export const R = 2;
export const DIRS: Dir[] = ['south', 'west', 'east', 'north'];

/** Quadros de caminhada por direção, a linha dos pés e a largura (px do mundo). */
export type Frames = {
  walk: Record<Dir, HTMLCanvasElement[]>; foot: Record<Dir, number>; w: number;
  /** Cintura (px do mundo, do topo do quadro): até onde aparece quem está sentado atrás de uma mesa. */
  waist: Record<Dir, number>;
};

/** Cintura padrão dos NPCs do GPT (cabeça até ~27, tronco até ~33). */
export const NPC_WAIST = 33;

/**
 * Sentado atrás de uma mesa (ou no barco): o quadro de andar só até a
 * cintura, com a cintura na linha `cutY` (o tampo da mesa, a borda do casco).
 * Tudo em px da tela; `x` é a esquerda do quadro.
 */
export function drawSeated(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, x: number, cutY: number, waist: number) {
  const top = cutY - waist, h = img.height / R;
  ctx.drawImage(img, 0, 0, img.width, waist * R, x, top, img.width / R, Math.min(waist, h));
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export function toCanvas(pm: Pixmap): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = pm.w; c.height = pm.h;
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(pm.data), pm.w, pm.h), 0, 0);
  return c;
}

/** Personagem a partir de um modelo-base pintado com o visual. */
export async function loadLookFrames(look: Look): Promise<Frames> {
  const [rows, waists] = await Promise.all([modelFrames(look), modelWaists(look.modelo).catch(() => null)]);
  const walk = {} as Record<Dir, HTMLCanvasElement[]>;
  const foot = {} as Record<Dir, number>;
  const waist = {} as Record<Dir, number>;
  MODEL_ROWS.forEach((d, i) => { walk[d] = rows[i]; foot[d] = MODEL_CELL.foot; waist[d] = waists?.[i] ?? NPC_WAIST; });
  return { walk, foot, w: MODEL_CELL.w / R, waist };
}

/**
 * Folha 4 × 4 pronta (NPCs e pets do GPT): linhas frente, esquerda, direita,
 * costas; quadros de `cw` × `ch` em hd, pés na linha `footHd`.
 */
export async function loadSheetFrames(url: string, cw: number, ch: number, footHd: number): Promise<Frames> {
  const img = await loadImage(url);
  const walk = {} as Record<Dir, HTMLCanvasElement[]>;
  const foot = {} as Record<Dir, number>;
  const waist = {} as Record<Dir, number>;
  MODEL_ROWS.forEach((d, r) => {
    waist[d] = Math.round((NPC_WAIST / 40) * (ch / R));
    walk[d] = [0, 1, 2, 3].map(c => {
      const cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      cv.getContext('2d')!.drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch);
      return cv;
    });
    foot[d] = footHd / R;
  });
  return { walk, foot, w: cw / R, waist };
}

const base = () => `${import.meta.env.BASE_URL}game/sprites`;
/** NPC pronto (public/game/sprites/npcs). */
export const loadNpcFrames = (id: string) => loadSheetFrames(`${base()}/npcs/${id}.png`, 64, 80, 76);
/** Reações do desafiante no duelo (public/game/sprites/npcs/reacoes): 8 quadros de 80 × 80
 *  — parado, pensando, jogando, apanhou, susto, comemorando, perdeu, sentado. */
export async function loadReactionFrames(id: string): Promise<HTMLCanvasElement[]> {
  const img = await loadImage(`${base()}/npcs/reacoes/${id}.png`);
  return [...Array(8).keys()].map(i => {
    const cv = document.createElement('canvas');
    cv.width = 80; cv.height = 80;
    cv.getContext('2d')!.drawImage(img, i * 80, 0, 80, 80, 0, 0, 80, 80);
    return cv;
  });
}
/** Pet do GPT (public/game/sprites/bichos). */
export const loadPetFrames = (id: string) => loadSheetFrames(`${base()}/bichos/${id}.png`, 48, 48, 46);

/** Plaquinhas prontas (canvas hd), por texto. */
const plates = new Map<string, HTMLCanvasElement>();
export function plateCanvas(name: string, title: string | undefined, st: PlateStyle): HTMLCanvasElement {
  const key = `${name}|${title ?? ''}|${st.border.join(',')}`;
  let c = plates.get(key);
  if (!c) { c = toCanvas(nameplate(name, title, st)); plates.set(key, c); }
  return c;
}
