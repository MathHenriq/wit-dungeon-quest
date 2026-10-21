// Sprites dos golpes de carta (public/game/efeitos/<id>.png, 6 quadros de 96 × 96
// vindos do GPT). Cada folha conta uma história (começo, pico, fim); aqui está
// como usar cada uma: o que toca enquanto voa, qual quadro tem o feixe, quais
// fazem o impacto. As 67 cartas Épica+ usam a própria folha. As Comum–Rara usam
// o pacote do elemento (public/game/masmorra/efeitos-elemento/<el>.png, §10 do
// docs/gpt-masmorra.md: voo, impacto, área e feixe), menor; tornado e corte,
// que o pacote não tem, emprestam uma folha Épica do elemento (PROXY). O objeto
// que a carta joga (kunai, carta, martelo...) vem de golpes/projeteis.png, e os
// golpes do caçador de golpes/golpes-jogador.png.
import type { Element } from '@/lib/tcg/types';
import type { Look } from '@/game/dungeon-moves';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';

/** Que tipo de desenho a folha tem. */
export type SheetKind = 'projetil' | 'feixe' | 'corte' | 'explosao' | 'pilar' | 'redemoinho' | 'zona';

export interface SheetInfo {
  kind: SheetKind;
  /** aponta para a direita (gira com o golpe) */
  dir?: boolean;
  /** quanto a folha já vem girada (rad), para acertar a direção */
  rot?: number;
  /** quadros que tocam em loop enquanto a peça existe */
  voo: [number, number];
  /** quadros do impacto (tocam uma vez) */
  fim: [number, number];
  /** quadro com o feixe deitado (origem à esquerda, ponta à direita) */
  feixe?: number;
  /** feixe em 3 quadros (início, corpo, ponta), como no pacote do elemento */
  beam3?: boolean;
}

const S = (kind: SheetKind, voo: [number, number], fim: [number, number], o: Partial<SheetInfo> = {}): SheetInfo => ({ kind, voo, fim, ...o });

/** As 67 folhas (conferidas uma a uma na folha de revisão do importador). */
export const SHEET: Record<string, SheetInfo> = {
  amaterasu: S('zona', [1, 3], [3, 5]),
  'ataque-giratorio': S('redemoinho', [1, 3], [3, 5]),
  'bajrang-gun': S('projetil', [0, 1], [2, 5], { dir: true, rot: 0.6 }),
  'beru-o-rei-formiga': S('redemoinho', [1, 3], [3, 5]),
  'big-bang-attack': S('projetil', [1, 2], [3, 5], { dir: true }),
  'black-flash': S('explosao', [0, 1], [1, 4]),
  'buda-de-mil-maos': S('pilar', [1, 3], [2, 5]),
  buraikan: S('redemoinho', [1, 4], [4, 5]),
  'contrato-com-o-diabo': S('pilar', [1, 3], [3, 5]),
  'decima-terceira-forma': S('explosao', [1, 2], [1, 4]),
  'dragao-das-chamas-negras': S('projetil', [1, 2], [3, 5], { dir: true }),
  'enuma-elish': S('redemoinho', [1, 3], [3, 5]),
  'espada-demoniaca-ragnarok': S('corte', [1, 3], [3, 5], { dir: true }),
  'espada-z': S('corte', [1, 2], [2, 5], { dir: true }),
  excalibur: S('corte', [2, 3], [3, 5], { dir: true, rot: 0.5 }),
  'final-flash': S('feixe', [0, 1], [4, 5], { dir: true, feixe: 3 }),
  'fogo-infernal': S('pilar', [2, 3], [3, 5]),
  'foice-da-morte': S('corte', [1, 3], [3, 5], { dir: true }),
  fuga: S('projetil', [0, 1], [2, 5], { dir: true }),
  'funeral-do-deserto': S('pilar', [1, 3], [3, 5]),
  'furia-de-kamish': S('feixe', [1, 2], [4, 5], { dir: true, feixe: 3 }),
  'gae-bolg': S('projetil', [1, 2], [3, 5], { dir: true }),
  'genki-dama': S('projetil', [0, 1], [2, 5]),
  'golpe-conquistador': S('explosao', [1, 2], [1, 5]),
  'gon-adulto': S('projetil', [0, 2], [2, 5], { dir: true }),
  'hakka-no-togame': S('explosao', [2, 3], [2, 5]),
  'hinokami-kagura': S('corte', [1, 3], [3, 5]),
  'howitzer-impact': S('redemoinho', [0, 2], [3, 5]),
  'kagune-liberado': S('corte', [1, 3], [3, 5], { dir: true }),
  kamehameha: S('feixe', [0, 1], [4, 5], { dir: true, feixe: 3 }),
  'kamui-raikiri': S('projetil', [1, 2], [3, 5], { dir: true }),
  'katana-parte-alma': S('corte', [1, 3], [3, 5], { dir: true }),
  kirin: S('pilar', [1, 3], [2, 5]),
  'kong-gun': S('explosao', [0, 2], [2, 5]),
  'konjiki-ashisogi-jizo': S('zona', [2, 3], [3, 5]),
  'lanca-invertida-do-ceu': S('projetil', [1, 2], [3, 5], { dir: true }),
  makankosappo: S('projetil', [2, 3], [4, 5], { dir: true, rot: 0.45 }),
  'matadora-de-dragoes': S('corte', [1, 3], [3, 5], { dir: true }),
  'mil-tubaroes': S('redemoinho', [1, 3], [3, 5]),
  mjolnir: S('pilar', [2, 3], [1, 4]),
  'modo-100': S('explosao', [1, 3], [1, 4]),
  'modo-demonio': S('pilar', [1, 3], [3, 5]),
  murasame: S('corte', [1, 3], [3, 5], { dir: true }),
  'nevoa-obscura': S('zona', [2, 3], [3, 5]),
  'nona-forma-rengoku': S('projetil', [1, 3], [3, 5], { dir: true }),
  'punho-divergente': S('explosao', [1, 2], [1, 4]),
  'punho-kaiju': S('pilar', [1, 2], [1, 4]),
  raigo: S('projetil', [2, 3], [4, 5], { dir: true }),
  railgun: S('feixe', [1, 1], [3, 5], { dir: true, feixe: 2 }),
  rasenshuriken: S('projetil', [1, 3], [3, 5]),
  'red-hawk': S('projetil', [0, 1], [2, 5], { dir: true }),
  reigan: S('projetil', [1, 2], [3, 5], { dir: true }),
  rhitta: S('explosao', [1, 2], [2, 5]),
  'sanzen-sekai': S('redemoinho', [1, 3], [3, 5]),
  senbonzakura: S('projetil', [0, 1], [4, 5]),
  'sessenta-e-quatro-palmas': S('explosao', [1, 2], [1, 4]),
  'smash-do-one-for-all': S('projetil', [0, 1], [4, 5]),
  'soco-serio': S('explosao', [1, 2], [1, 4]),
  'star-burst-stream': S('explosao', [1, 2], [1, 4]),
  'tengai-shinsei': S('projetil', [0, 1], [2, 5], { dir: true, rot: Math.PI / 2 }),
  'tensa-zangetsu': S('corte', [1, 3], [3, 5], { dir: true }),
  'tita-colossal': S('pilar', [1, 3], [1, 4]),
  'tita-de-ataque': S('pilar', [1, 3], [1, 4]),
  turbo: S('feixe', [0, 1], [4, 5], { dir: true, feixe: 2 }),
  'united-states-of-smash': S('explosao', [1, 2], [1, 4]),
  'vazio-roxo': S('feixe', [1, 2], [4, 5], { dir: true, feixe: 3 }),
  zoltraak: S('feixe', [0, 1], [4, 5], { dir: true, feixe: 3 }),
};

/** Para que a folha vai ser usada. */
export type Use = 'impacto' | 'feixe' | 'zona' | 'tornado' | 'corte' | 'proj';

/** Uma folha pronta para desenhar: 6 quadros lado a lado (imagem ou linha recortada de uma grade). */
export type Img = HTMLImageElement | HTMLCanvasElement;

/**
 * Pacote do elemento (6 × 4 de 64): cada linha vira uma folha `elem-<el>-<uso>`.
 * Voo (4 quadros), impacto (6), área no chão (4 em loop) e feixe em 3 quadros
 * (início, corpo emendável, ponta: `beam3`).
 */
const ELEM_ROWS = ['proj', 'impacto', 'zona', 'feixe'] as const;
const ELEM_INFO: Record<(typeof ELEM_ROWS)[number], SheetInfo> = {
  proj: S('projetil', [0, 3], [0, 3], { dir: true }),
  impacto: S('explosao', [0, 2], [0, 5]),
  zona: S('zona', [0, 3], [0, 3]),
  feixe: S('feixe', [0, 0], [2, 2], { dir: true, beam3: true }),
};
export const elemId = (el: Element, use: (typeof ELEM_ROWS)[number]) => `elem-${el.toLowerCase()}-${use}`;

/** Golpes do caçador (6 × 6 de 64): linha N vira a folha `golpe-N`. */
export const GOLPE = {
  corteA: 'golpe-0', corteB: 'golpe-1', final: 'golpe-2', giro: 'golpe-3', estocada: 'golpe-4', faisca: 'golpe-5',
} as const;
const GOLPE_INFO = S('corte', [0, 3], [0, 3]);

/** Como desenhar qualquer folha: as 67 das cartas, as linhas dos pacotes e dos golpes. */
export function sheetInfo(id: string): SheetInfo | undefined {
  if (SHEET[id]) return SHEET[id];
  if (id.startsWith('elem-')) return ELEM_INFO[id.slice(id.lastIndexOf('-') + 1) as (typeof ELEM_ROWS)[number]];
  if (id.startsWith('golpe-')) return GOLPE_INFO;
  return undefined;
}

/**
 * Folha emprestada para as Comum–Rara, por elemento. Só folhas "genéricas"
 * (chama, redemoinho, explosão, feixe, corte); nunca as de assinatura (mãos do
 * Buda, tubarões, pé do Titã, dragão Kirin). Sem folha: desenho em pixel.
 */
export const PROXY: Record<Element, Partial<Record<Use, string>>> = {
  Fire: { impacto: 'rhitta', feixe: 'furia-de-kamish', zona: 'fogo-infernal', tornado: 'howitzer-impact', corte: 'hinokami-kagura' },
  Water: { impacto: 'buraikan', feixe: 'kamehameha', zona: 'buraikan', tornado: 'buraikan', corte: 'katana-parte-alma' },
  Grass: { impacto: 'sanzen-sekai', feixe: 'smash-do-one-for-all', zona: 'sanzen-sekai', tornado: 'sanzen-sekai', corte: 'murasame' },
  Electric: { impacto: 'mjolnir', feixe: 'final-flash', zona: 'mjolnir', tornado: 'kamui-raikiri', corte: 'kamui-raikiri' },
  Ice: { impacto: 'hakka-no-togame', feixe: 'kamehameha', zona: 'hakka-no-togame', tornado: 'hakka-no-togame', corte: 'lanca-invertida-do-ceu' },
  Fighting: { impacto: 'punho-divergente', zona: 'united-states-of-smash', tornado: 'golpe-conquistador' },
  Poison: { impacto: 'konjiki-ashisogi-jizo', zona: 'konjiki-ashisogi-jizo', tornado: 'murasame', corte: 'murasame' },
  Ground: { impacto: 'tengai-shinsei', zona: 'funeral-do-deserto', tornado: 'funeral-do-deserto' },
  Flying: { impacto: 'rasenshuriken', zona: 'nevoa-obscura', tornado: 'ataque-giratorio' },
  Ghost: { impacto: 'modo-100', feixe: 'vazio-roxo', zona: 'modo-100', tornado: 'modo-100', corte: 'foice-da-morte' },
  Dark: { impacto: 'black-flash', feixe: 'zoltraak', zona: 'amaterasu', tornado: 'dragao-das-chamas-negras', corte: 'tensa-zangetsu' },
  Steel: { impacto: 'star-burst-stream', feixe: 'final-flash', zona: 'star-burst-stream', tornado: 'sanzen-sekai', corte: 'espada-z' },
};

/** Tamanho pela raridade: a emprestada fica menor que a da dona. */
const RARITY_SCALE: Record<string, number> = { common: 0.6, uncommon: 0.7, rare: 0.8 };

export interface Pick { id: string; info: SheetInfo; own: boolean; scale: number }

/** Folhas que servem de área (zona no chão, tornado): o tigre do Rengoku não vira chão. */
const AREA: SheetKind[] = ['zona', 'pilar', 'explosao', 'redemoinho'];

/** A folha para uma peça da carta: a própria (Épica+) ou a do elemento. */
export function pick(card: string, el: Element, use: Use): Pick | null {
  const id = card.replace(/\+$/, '');
  if (use !== 'proj' && SHEET[id] && ((use !== 'zona' && use !== 'tornado') || AREA.includes(SHEET[id].kind))) return { id, info: SHEET[id], own: true, scale: 1 };
  const scale = SHEET[id] ? 0.8 : RARITY_SCALE[CARD_BY_ID.get(id)?.rarity ?? 'common'] ?? 0.7;
  // o pacote do elemento, quando já carregou (impacto, área, feixe e voo)
  if (use === 'impacto' || use === 'zona' || use === 'feixe' || use === 'proj') {
    const e = elemId(el, use);
    if (sheetImg(e)) return { id: e, info: ELEM_INFO[use], own: false, scale };
  }
  const p = use === 'proj' ? undefined : PROXY[el]?.[use];
  if (!p) return null;
  return { id: p, info: SHEET[p], own: false, scale };
}

// ─── carregar e desenhar ────────────────────────────────────────────────────

const IMGS = new Map<string, Img | null>();
const BASE = import.meta.env.BASE_URL;

/** Grade em linhas: cada linha (6 quadros de `cw`) vira uma folha `<prefixo><linha>`. */
function loadRows(url: string, ids: string[], cw: number, ch: number) {
  for (const id of ids) IMGS.set(id, null);
  const img = new Image();
  img.onload = () => ids.forEach((id, r) => {
    const cv = document.createElement('canvas');
    cv.width = cw * 6; cv.height = ch;
    cv.getContext('2d')!.drawImage(img, 0, r * ch, cw * 6, ch, 0, 0, cw * 6, ch);
    IMGS.set(id, cv);
  });
  img.src = url;
}

/** A folha (carrega uma vez; null enquanto não chegou ou se não existe). */
export function sheetImg(id: string): Img | null {
  if (!IMGS.has(id)) {
    if (id.startsWith('elem-')) {
      const el = id.slice(5, id.lastIndexOf('-'));
      loadRows(`${BASE}game/masmorra/efeitos-elemento/${el}.png`, ELEM_ROWS.map(u => `elem-${el}-${u}`), 64, 64);
    } else if (id.startsWith('golpe-')) {
      loadRows(`${BASE}game/masmorra/golpes/golpes-jogador.png`, [0, 1, 2, 3, 4, 5].map(r => `golpe-${r}`), 64, 64);
    } else {
      IMGS.set(id, null);
      const img = new Image();
      img.onload = () => IMGS.set(id, img);
      img.src = `${BASE}game/efeitos/${id}.png`;
    }
  }
  return IMGS.get(id) ?? null;
}

/** Já pede as folhas da v2 (golpes e os 12 pacotes) para não faltarem no primeiro golpe. */
export function preloadSheets(elements: Element[]) {
  sheetImg(GOLPE.corteA);
  for (const el of elements) sheetImg(elemId(el, 'impacto'));
  lookSheet();
}

/** Quadro `f` com o centro em (x, y), lado `size`, girado `ang`. Diminuir suaviza; aumentar não. */
export function drawFrame(ctx: CanvasRenderingContext2D, img: Img, f: number, x: number, y: number, size: number, ang = 0, anchorBottom = false) {
  const fw = img.width / 6, fh = img.height;
  ctx.save();
  ctx.imageSmoothingEnabled = size < fw;
  ctx.imageSmoothingQuality = 'medium';
  ctx.translate(Math.round(x), Math.round(y));
  if (ang) ctx.rotate(ang);
  ctx.drawImage(img, Math.max(0, Math.min(5, f)) * fw, 0, fw, fh, -size / 2, anchorBottom ? -size * 0.92 : -size / 2, size, size);
  ctx.restore();
}

/** Quadro do loop agora (anda a 12 por segundo, vai e volta entre a e b). */
export function loopFrame([a, b]: [number, number], now: number, seed = 0): number {
  if (a === b) return a;
  const n = b - a + 1, k = Math.floor(now / 83 + seed) % (2 * n - 2 || 1);
  return a + (k < n ? k : 2 * n - 2 - k);
}

export interface BeamCut { cy: number; th: number; x0: number; x1: number }
const CUTS = new Map<string, BeamCut | null>();
/**
 * Onde está o feixe no quadro `f`: linha do meio (cy), grossura (th) e onde a
 * origem acaba (x0) e a ponta começa (x1), medido na coluna do meio.
 */
export function beamCut(img: Img, id: string, f: number): BeamCut | null {
  const key = `${id}|${f}`;
  if (CUTS.has(key)) return CUTS.get(key)!;
  const fw = img.width / 6, fh = img.height;
  const c = document.createElement('canvas');
  c.width = fw; c.height = fh;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.drawImage(img, f * fw, 0, fw, fh, 0, 0, fw, fh);
  const d = x.getImageData(0, 0, fw, fh).data;
  const col = Math.round(fw * 0.55);
  let top = -1, bot = -1;
  for (let y = 0; y < fh; y++) if (d[(y * fw + col) * 4 + 3] > 100) { if (top < 0) top = y; bot = y; }
  const cut = top < 0 || bot - top < 4 ? null : { cy: (top + bot) / 2, th: bot - top + 1, x0: Math.round(fw * 0.4), x1: Math.round(fw * 0.62) };
  CUTS.set(key, cut);
  return cut;
}

/**
 * Feixe montado da folha: origem (esquerda do quadro), corpo (uma fatia
 * esticada até o comprimento) e ponta (direita do quadro). (x, y) = origem,
 * `len` e `w` em px.
 */
export function drawBeam(ctx: CanvasRenderingContext2D, img: Img, id: string, f: number, x: number, y: number, ang: number, len: number, w: number): boolean {
  const cut = beamCut(img, id, f);
  if (!cut) return false;
  const fw = img.width / 6, fh = img.height, s = Math.max(0.35, w / cut.th);
  const headW = (fw - cut.x1) * s, tailW = cut.x0 * s, body = Math.max(0, len - headW - tailW * 0.5);
  ctx.save();
  ctx.imageSmoothingEnabled = s < 1; ctx.imageSmoothingQuality = 'medium';
  ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
  const top = -cut.cy * s, h = fh * s;
  // origem um pouco para trás (fica atrás da mão)
  ctx.drawImage(img, f * fw, 0, cut.x0, fh, -tailW * 0.5, top, tailW, h);
  if (body > 0) ctx.drawImage(img, f * fw + Math.round(fw * 0.55), 0, 2, fh, tailW * 0.5, top, body, h);
  ctx.drawImage(img, f * fw + cut.x1, 0, fw - cut.x1, fh, tailW * 0.5 + body, top, headW, h);
  ctx.restore();
  return true;
}

/**
 * Feixe do pacote do elemento: o quadro 0 (início, o brilho fica na mão), o
 * quadro 1 repetido até o comprimento (o corpo emenda dos dois lados) e o
 * quadro 2 na ponta. (x, y) = mão; `w` = grossura em px.
 */
export function drawBeam3(ctx: CanvasRenderingContext2D, img: Img, id: string, x: number, y: number, ang: number, len: number, w: number): boolean {
  const cut = beamCut(img, id, 1);
  if (!cut) return false;
  const fw = img.width / 6, fh = img.height, s = Math.max(0.35, w / cut.th), cw = fw * s, h = fh * s, top = -cut.cy * s;
  ctx.save();
  ctx.imageSmoothingEnabled = s < 1; ctx.imageSmoothingQuality = 'medium';
  ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
  const start = cw * 0.45, end = Math.max(start, len - cw * 0.7);
  // corpo: o quadro 1 repetido (o último pedaço cortado na medida)
  for (let bx = start; bx < end; bx += cw) {
    const piece = Math.min(cw, end - bx);
    ctx.drawImage(img, fw, 0, (piece / cw) * fw, fh, bx, top, piece, h);
  }
  ctx.drawImage(img, 0, 0, fw, fh, start - cw, top, cw, h);
  ctx.drawImage(img, fw * 2, 0, fw, fh, end - cw * 0.3, top, cw, h);
  ctx.restore();
  return true;
}

// ─── objetos das cartas (golpes/projeteis.png, 8 × 6 de 32) ──────────────────

/** A ordem da folha: a mesma do tipo `Look` (e do prompt do GPT). */
export const LOOK_ORDER: Look[] = [
  'bola', 'lamina', 'lanca', 'tubarao', 'carta', 'martelo', 'estrela', 'shuriken', 'esfera', 'dragao', 'petala',
  'gota', 'onda', 'lua', 'punho', 'rocha', 'neve', 'agulha', 'kunai', 'espada', 'inseto', 'coracao', 'cristal',
  'flecha', 'raio', 'meteoro', 'mao', 'sol', 'areia', 'raiz', 'gelo', 'sombra', 'pilar', 'tigre', 'asas',
  'lagarto', 'nuvem', 'cratera', 'ar', 'decadencia', 'teia', 'fumaca', 'vapor', 'luz', 'orbe',
];
/** Cabeças e bichos: espelham ao ir para a esquerda (não ficam de cabeça para baixo). */
const LOOK_FLIP = new Set<Look>(['dragao', 'tigre', 'lagarto', 'tubarao', 'asas', 'inseto', 'punho', 'mao', 'meteoro']);
/** Giram no próprio eixo. */
const LOOK_SPIN = new Set<Look>(['estrela', 'shuriken', 'carta', 'martelo']);
/** Ficam em pé (só espelham ao ir para a esquerda, para o rastro ficar atrás). */
const LOOK_UP = new Set<Look>(['nuvem', 'fumaca', 'vapor', 'areia', 'coracao', 'sol', 'teia', 'pilar', 'cratera', 'decadencia', 'esfera', 'orbe']);
/** Objetos de energia, sem cor de verdade: levam a cor da carta (a lua da Getsuga fica roxa, a hidra de veneno não é de fogo).
 *  Os que têm cor própria (carta, kunai, martelo, coração, tigre...) ficam como vieram. */
const LOOK_TINT = new Set<Look>(['bola', 'lamina', 'lanca', 'esfera', 'dragao', 'gota', 'onda', 'lua', 'estrela', 'cristal', 'raio', 'meteoro', 'gelo', 'sombra', 'asas', 'ar', 'decadencia', 'vapor', 'luz', 'orbe']);
const TINTED = new Map<string, HTMLCanvasElement>();
/** Célula `i` da folha com o matiz de `color` (mantém o claro e escuro do desenho); feita uma vez por cor. */
function tintCell(sh: HTMLImageElement, i: number, color: string) {
  const key = `${i}|${color}`;
  let cv = TINTED.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = cv.height = 32;
    const c = cv.getContext('2d')!, sx = (i % 8) * 32, sy = Math.floor(i / 8) * 32;
    c.drawImage(sh, sx, sy, 32, 32, 0, 0, 32, 32);
    c.globalCompositeOperation = 'color'; c.fillStyle = color; c.fillRect(0, 0, 32, 32);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(sh, sx, sy, 32, 32, 0, 0, 32, 32);
    TINTED.set(key, cv);
  }
  return cv;
}

let LOOKS: HTMLImageElement | null | undefined;
function lookSheet(): HTMLImageElement | null {
  if (LOOKS === undefined) {
    LOOKS = null;
    const img = new Image();
    img.onload = () => { LOOKS = img; };
    img.src = `${BASE}game/masmorra/golpes/projeteis.png`;
  }
  return LOOKS;
}

/** O objeto da carta voando em (x, y), lado `size`, para o ângulo `ang`, com o matiz `tint` nos objetos de energia.
 *  false se a folha não chegou. */
export function drawLook(ctx: CanvasRenderingContext2D, look: Look | undefined, x: number, y: number, ang: number, size: number, now: number, tint?: string): boolean {
  const sh = lookSheet(), i = LOOK_ORDER.indexOf(look ?? 'bola');
  if (!sh || i < 0) return false;
  const lk = LOOK_ORDER[i];
  ctx.save();
  ctx.imageSmoothingEnabled = size < 32; ctx.imageSmoothingQuality = 'medium';
  ctx.translate(Math.round(x), Math.round(y));
  if (LOOK_SPIN.has(lk)) ctx.rotate(Math.floor(now / 42) * 0.5);
  else if (LOOK_UP.has(lk)) { if (Math.cos(ang) < -0.01) ctx.scale(-1, 1); }
  else {
    ctx.rotate(ang);
    if (LOOK_FLIP.has(lk) && Math.cos(ang) < 0) ctx.scale(1, -1);
  }
  if (tint && LOOK_TINT.has(lk)) ctx.drawImage(tintCell(sh, i, tint), -size / 2, -size / 2, size, size);
  else ctx.drawImage(sh, (i % 8) * 32, Math.floor(i / 8) * 32, 32, 32, -size / 2, -size / 2, size, size);
  ctx.restore();
  return true;
}
