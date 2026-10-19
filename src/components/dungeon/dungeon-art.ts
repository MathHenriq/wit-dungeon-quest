// Arte do GPT da masmorra (docs/gpt-masmorra.md → scripts/arte/importar-masmorra.py
// → public/game/masmorra/...). Cada folha é opcional: sem ela, a tela continua
// com o desenho em código.
import type { WeaponId } from '@/game/dungeon-weapons';
import type { SombraKind } from '@/game/hunter-state';

const BASE = `${import.meta.env.BASE_URL}game/masmorra`;
/** Tema de cada rank (E caverna, D cripta, C gelo, B lava, A floresta, S sombras). */
export const RANK_FILE = ['e', 'd', 'c', 'b', 'a', 's'];

export interface DArt {
  /** piso-parede-<rank>.png: 4 × 3 azulejos de 32 (piso, parede de frente, detalhes) */
  tiles: (HTMLImageElement | null)[];
  /** cor do topo da parede de cada rank (tirada do azulejo), para as paredes de lado */
  caps: (string | null)[];
  /** objetos.png: 4 × 4 de 64 (ordem em OBJ) */
  obj: HTMLImageElement | null;
  /** portal.png: 4 quadros de 96 × 128 */
  portal: HTMLImageElement | null;
  /** armas-curtas.png e armas-longas.png: 4 × 2 de 48, apontando para a direita */
  curtas: HTMLImageElement | null;
  longas: HTMLImageElement | null;
  /** tiros.png: 4 × 4 de 16 (linhas: tiro, flecha, orbe, bola do inimigo; coluna 4 = impacto) */
  tiros: HTMLImageElement | null;
  /** perigos.png: 4 × 2 de 32 (espinho baixo, aviso, alto, veneno; gelo, lava ×2, barril explosivo) */
  perigos: HTMLImageElement | null;
  /** salas.png: 4 × 2 de 64 (estátua, mercador, lampião aceso, apagado; pedra da ressurreição, parede rachada, baú do desafio, alçapão) */
  salas: HTMLImageElement | null;
  /** sombras do Arise: 4 × 4 de 48 (frente, esquerda, direita, costas; andar ×2, ataque ×2) */
  sombras: Partial<Record<SombraKind, HTMLImageElement>>;
  /** quantas folhas já chegaram (entra na chave do cache da sala) */
  ok: number;
}

export const newDArt = (): DArt => ({ tiles: [null, null, null, null, null, null], caps: [null, null, null, null, null, null], obj: null, portal: null, curtas: null, longas: null, tiros: null, perigos: null, salas: null, sombras: {}, ok: 0 });

function img(url: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = url;
  });
}

/** Cor média do topo da parede (as 5 primeiras linhas do azulejo de parede). */
function capColor(t: HTMLImageElement): string {
  const cv = document.createElement('canvas');
  cv.width = 32; cv.height = 5;
  const x = cv.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(t, 0, 32, 32, 5, 0, 0, 32, 5);
  const d = x.getImageData(0, 0, 32, 5).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
}

/** Carrega as folhas que existirem; `onLoad` a cada uma que chega. */
export function loadDArt(a: DArt, onLoad: () => void, alive: () => boolean): void {
  const got = (set: (i: HTMLImageElement) => void) => (i: HTMLImageElement | null) => { if (i && alive()) { set(i); a.ok++; onLoad(); } };
  RANK_FILE.forEach((r, k) => void img(`${BASE}/lugares/piso-parede-${r}.png`).then(got(i => { a.tiles[k] = i; a.caps[k] = capColor(i); })));
  void img(`${BASE}/lugares/objetos.png`).then(got(i => { a.obj = i; }));
  void img(`${BASE}/lugares/portal.png`).then(got(i => { a.portal = i; }));
  void img(`${BASE}/lugares/perigos.png`).then(got(i => { a.perigos = i; }));
  void img(`${BASE}/lugares/salas.png`).then(got(i => { a.salas = i; }));
  void img(`${BASE}/armas/armas-curtas.png`).then(got(i => { a.curtas = i; }));
  void img(`${BASE}/armas/armas-longas.png`).then(got(i => { a.longas = i; }));
  void img(`${BASE}/armas/tiros.png`).then(got(i => { a.tiros = i; }));
  for (const s of ['soldado', 'arqueira', 'tanque'] as SombraKind[]) void img(`${BASE}/sombras/sombra-${s}.png`).then(got(i => { a.sombras[s] = i; }));
}

/** Peças de objetos.png (índice na grade 4 × 4). */
export const OBJ = {
  pedra: 0, pedraRachada: 1, cobre: 2, ferro: 3, ouro: 4, cristal: 5, ervaCura: 6, ervaMana: 7,
  bau: 8, bauAberto: 9, escada: 10, elevador: 11, porta: 12, portaAbrindo: 13, barril: 14, pote: 15,
} as const;

/** Arma → quadro nas folhas de armas (curtas e longas, 4 × 2). */
export const WEAPON_CELL: Record<WeaponId, number> = {
  espada: 0, katana: 1, adaga: 2, lanca: 3, machado: 4, martelo: 5, foice: 6, punhos: 7,
  pistola: 0, besta: 1, arco: 2, cajado: 3, varinha: 4, canhao: 5, fuzil: 6, livro: 7,
};
export const LONGAS: WeaponId[] = ['pistola', 'besta', 'arco', 'cajado', 'varinha', 'canhao', 'fuzil', 'livro'];

/** Quadro `idx` de uma folha em grade `cols` × ? de `cw` × `ch`, desenhado em (dx, dy, dw, dh). */
export function drawCell(ctx: CanvasRenderingContext2D, im: CanvasImageSource, cw: number, ch: number, cols: number, idx: number, dx: number, dy: number, dw = cw, dh = ch) {
  ctx.drawImage(im, (idx % cols) * cw, Math.floor(idx / cols) * ch, cw, ch, dx, dy, dw, dh);
}

/** Objeto de objetos.png com a base em (x, y) da tela (centro embaixo), `size` px. */
export function drawObj(ctx: CanvasRenderingContext2D, a: DArt, idx: number, x: number, y: number, size = 40) {
  if (!a.obj) return false;
  drawCell(ctx, a.obj, 64, 64, 4, idx, x - size / 2, y - size, size, size);
  return true;
}

/** Peças de perigos.png (4 × 2 de 32) e salas.png (4 × 2 de 64). */
export const PERIGO = { espinhoBaixo: 0, espinhoAviso: 1, espinhoAlto: 2, veneno: 3, gelo: 4, lava: 5, lava2: 6, explosivo: 7 } as const;
export const SALA = { estatua: 0, mercador: 1, lampiao: 2, lampiaoApagado: 3, pedra: 4, paredeRachada: 5, bauDesafio: 6, alcapao: 7 } as const;

/** Peça de salas.png com a base em (x, y) (centro embaixo), `size` px. */
export function drawSala(ctx: CanvasRenderingContext2D, a: DArt, idx: number, x: number, y: number, size = 56) {
  if (!a.salas) return false;
  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = size < 64; ctx.imageSmoothingQuality = 'medium';
  drawCell(ctx, a.salas, 64, 64, 4, idx, x - size / 2, y - size, size, size);
  ctx.imageSmoothingEnabled = sm;
  return true;
}

/** Arma na mão: o cabo (lado esquerdo do quadro) fica na origem, apontando para +x. */
export function drawWeapon(ctx: CanvasRenderingContext2D, a: DArt, id: WeaponId, len = 34) {
  const sheet = LONGAS.includes(id) ? a.longas : a.curtas;
  if (!sheet) return false;
  const k = len / 48;
  // menor que a folha: suaviza (o "vizinho mais perto" comeria pixel de forma desigual)
  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = k < 1; ctx.imageSmoothingQuality = 'high';
  drawCell(ctx, sheet, 48, 48, 4, WEAPON_CELL[id], -6 * k, -24 * k, 48 * k, 48 * k);
  ctx.imageSmoothingEnabled = sm;
  return true;
}

/** Número de 0 a 1 sempre igual para os mesmos números (variação do piso pela semente). */
export function hash(...n: number[]): number {
  let h = 2166136261;
  for (const v of n) { h ^= v | 0; h = Math.imul(h, 16777619); h ^= h >>> 13; }
  return ((h >>> 0) % 10000) / 10000;
}
