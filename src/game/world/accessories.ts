// Acessórios do personagem (boné, óculos, mochila...): sprites em
// public/game/sprites/acessorios (atlas + manifest, gerados por
// scripts/arte/importar-acessorios.py), em tons de cinza para pintar com a cor
// escolhida. O encaixe é calculado aqui: mede a cabeça e o tronco de cada
// quadro do modelo (pelas cores-molde) e põe o acessório pelo tipo dele, de
// modo que acompanha o balanço do passo e serve nos 10 modelos.
// Funções puras (testáveis); só loadAccessories usa o navegador.
import { CLOTH, MOLDE, type Ramp } from './outfit';

export type AccSlot = 'cabeca' | 'rosto' | 'corpo';
export const ACC_SLOTS: { id: AccSlot; nome: string }[] = [
  { id: 'cabeca', nome: 'CABEÇA' }, { id: 'rosto', nome: 'ROSTO' }, { id: 'corpo', nome: 'CORPO' },
];

type Anchor = 'topo' | 'olhos' | 'orelhas' | 'lado' | 'pescoco' | 'costas' | 'cruzado' | 'cintura';
/** Tipo de encaixe; `k` = onde fica a base do chapéu, em fração da altura da cabeça. */
export const ACC_INFO: Record<string, { slot: AccSlot; anchor: Anchor; k?: number }> = {
  bone: { slot: 'cabeca', anchor: 'topo', k: 0.44 },
  gorro: { slot: 'cabeca', anchor: 'topo', k: 0.5 },
  chapeu: { slot: 'cabeca', anchor: 'topo', k: 0.42 },
  viseira: { slot: 'cabeca', anchor: 'topo', k: 0.4 },
  bandana: { slot: 'cabeca', anchor: 'topo', k: 0.42 },
  'coroa-flores': { slot: 'cabeca', anchor: 'topo', k: 0.4 },
  faixa: { slot: 'cabeca', anchor: 'topo', k: 0.46 },
  'orelhas-gato': { slot: 'cabeca', anchor: 'topo', k: 0.36 },
  coroa: { slot: 'cabeca', anchor: 'topo', k: 0.26 },
  laco: { slot: 'cabeca', anchor: 'lado' },
  presilha: { slot: 'cabeca', anchor: 'lado' },
  fone: { slot: 'cabeca', anchor: 'orelhas' },
  'protetor-orelha': { slot: 'cabeca', anchor: 'orelhas' },
  oculos: { slot: 'rosto', anchor: 'olhos' },
  'oculos-sol': { slot: 'rosto', anchor: 'olhos' },
  'oculos-aviador': { slot: 'rosto', anchor: 'olhos' },
  cachecol: { slot: 'corpo', anchor: 'pescoco' },
  mochila: { slot: 'corpo', anchor: 'costas' },
  bolsa: { slot: 'corpo', anchor: 'cruzado' },
  pochete: { slot: 'corpo', anchor: 'cintura' },
};

export interface AccDef { nome: string; a: [number, number, number, number][]; fixo?: boolean }
export type AccManifest = Record<string, AccDef>;
export interface Wear { id: string; cor?: string }
export type Wearing = Partial<Record<AccSlot, Wear>>;
export const DEFAULT_ACC_COLOR = 'vermelho';

/** Medidas de um quadro (px da folha, dentro do quadro). */
export interface Body {
  top: number; neck: number; headL: number; headR: number;
  torsoL: number; torsoR: number; torsoBottom: number;
}

const hexRgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const keyOf = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;
const setOf = (hs: readonly string[]) => new Set(hs.map(h => { const [r, g, b] = hexRgb(h); return keyOf(r, g, b); }));
// (calculados na primeira medida: outfit.ts importa este módulo)
let HEAD: Set<number> | null = null, TOP: Set<number> | null = null;

/**
 * Mede cabeça e tronco de cada quadro de uma folha em cores-molde (antes de
 * pintar): 4 linhas × 4 colunas de cw × ch. A cabeça vai do primeiro pixel
 * até onde começa a roupa de cima (o pescoço).
 */
export function measureFrames(data: Uint8ClampedArray | Uint8Array, width: number, cw: number, ch: number): Body[] {
  HEAD ??= setOf([...MOLDE.hair, ...MOLDE.skin]);
  TOP ??= setOf(MOLDE.top);
  const head = HEAD, topSet = TOP;
  const out: Body[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    let top = -1, neck = -1, torsoBottom = -1;
    let headL = cw, headR = -1, torsoL = cw, torsoR = -1;
    const at = (x: number, y: number) => ((r * ch + y) * width + c * cw + x) * 4;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = at(x, y);
        if (!data[i + 3]) continue;
        if (top < 0) top = y;
        const k = keyOf(data[i], data[i + 1], data[i + 2]);
        if (topSet.has(k)) {
          if (neck < 0) neck = y;
          torsoL = Math.min(torsoL, x); torsoR = Math.max(torsoR, x); torsoBottom = y;
        }
      }
    }
    if (top < 0) top = 0;
    if (neck < 0) neck = Math.round(top + (ch - top) * 0.55);
    for (let y = top; y < neck; y++) for (let x = 0; x < cw; x++) {
      const i = at(x, y);
      if (data[i + 3] && head.has(keyOf(data[i], data[i + 1], data[i + 2]))) { headL = Math.min(headL, x); headR = Math.max(headR, x); }
    }
    if (headR < 0) { headL = cw * 0.25; headR = cw * 0.75; }
    if (torsoR < 0) { torsoL = cw * 0.35; torsoR = cw * 0.65; torsoBottom = neck + 10; }
    out.push({ top, neck, headL, headR: headR + 1, torsoL, torsoR: torsoR + 1, torsoBottom: torsoBottom + 1 });
  }
  return out;
}

/**
 * Onde desenhar o acessório no quadro: canto de cima à esquerda, se fica atrás
 * do corpo e se some nesta direção. dir: 0 frente, 1 esquerda, 2 direita, 3 costas.
 */
export function placeAcc(id: string, dir: number, b: Body, w: number, h: number): { x: number; y: number; behind: boolean; hidden: boolean } {
  const info = ACC_INFO[id];
  const headH = b.neck - b.top, headW = b.headR - b.headL, cx = (b.headL + b.headR) / 2;
  const tcx = (b.torsoL + b.torsoR) / 2;
  let x = cx - w / 2, y = b.top, behind = false, hidden = false;
  switch (info?.anchor ?? 'topo') {
    case 'topo':
      y = b.top + (info?.k ?? 0.4) * headH - h;
      // de lado, encosta a parte de trás do chapéu na nuca (a aba vai para a frente)
      if (dir === 1) x = b.headR + 1 - w;
      if (dir === 2) x = b.headL - 1;
      break;
    case 'olhos':
      y = b.top + 0.64 * headH - h / 2;
      if (dir === 1) x = b.headL - 2;
      if (dir === 2) x = b.headR + 2 - w;
      hidden = dir === 3;
      break;
    case 'orelhas':
      y = b.top + 0.52 * headH - h / 2;
      break;
    case 'lado': {
      const off = [0.3, 0.22, -0.22, -0.3][dir] * headW;
      x = cx + off - w / 2;
      y = b.top + 0.16 * headH - h / 2;
      break;
    }
    case 'pescoco':
      x = tcx - w / 2; y = b.neck - 3;
      break;
    case 'costas':
      y = b.neck - 1;
      x = dir === 1 ? b.torsoR - w * 0.55 : dir === 2 ? b.torsoL - w * 0.45 : tcx - w / 2;
      behind = dir !== 3;
      break;
    case 'cruzado':
      x = tcx - w / 2; y = b.neck;
      behind = dir === 3;
      break;
    case 'cintura':
      x = tcx - w / 2; y = b.torsoBottom - h / 2 - 1;
      behind = dir === 3;
      break;
  }
  return { x: Math.round(x), y: Math.round(y), behind, hidden };
}

/** Pinta um acessório cinza com a rampa (o contorno escuro fica). */
export function tintGray(data: Uint8ClampedArray | Uint8Array, ramp: Ramp): void {
  const cols = ramp.map(hexRgb);
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const l = data[i];
    if (l < 52) continue;
    const t = (l - 52) / 203;
    const c = cols[t < 0.28 ? 0 : t < 0.52 ? 1 : t < 0.78 ? 2 : 3];
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
  }
}

/** Confere o que está vestido: acessório que existe, no espaço certo, cor válida. */
export function normalizeWearing(w: unknown): Wearing | undefined {
  if (!w || typeof w !== 'object') return undefined;
  const out: Wearing = {};
  for (const { id: slot } of ACC_SLOTS) {
    const v = (w as Record<string, unknown>)[slot] as Record<string, unknown> | undefined;
    if (!v || typeof v.id !== 'string' || ACC_INFO[v.id]?.slot !== slot) continue;
    out[slot] = { id: v.id, ...(typeof v.cor === 'string' && v.cor in CLOTH ? { cor: v.cor } : {}) };
  }
  return Object.keys(out).length ? out : undefined;
}

export interface AccAssets { atlas: HTMLImageElement; manifest: AccManifest }
let accP: Promise<AccAssets> | null = null;
export function loadAccessories(): Promise<AccAssets> {
  if (!accP) {
    const base = `${import.meta.env.BASE_URL}game/sprites/acessorios`;
    accP = Promise.all([
      fetch(`${base}/manifest.json`).then(r => r.json() as Promise<AccManifest>),
      new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `${base}/atlas.png`; }),
    ]).then(([manifest, atlas]) => ({ atlas, manifest }));
    accP.catch(() => { accP = null; });
  }
  return accP;
}
