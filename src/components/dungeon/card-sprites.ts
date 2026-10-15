// Sprites dos golpes de carta (public/game/efeitos/<id>.png, 6 quadros de 96 × 96
// vindos do GPT). Cada folha conta uma história (começo, pico, fim); aqui está
// como usar cada uma: o que toca enquanto voa, qual quadro tem o feixe, quais
// fazem o impacto. As 67 cartas Épica+ usam a própria folha. As Comum–Rara
// pegam uma folha do mesmo elemento (PROXY), menor, até o pacote de efeitos por
// elemento do GPT chegar (docs/gpt-masmorra.md §10).
import type { Element } from '@/lib/tcg/types';
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
export type Use = 'impacto' | 'feixe' | 'zona' | 'tornado' | 'corte';

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
  if (SHEET[id] && ((use !== 'zona' && use !== 'tornado') || AREA.includes(SHEET[id].kind))) return { id, info: SHEET[id], own: true, scale: 1 };
  const p = PROXY[el]?.[use];
  if (!p) return null;
  return { id: p, info: SHEET[p], own: false, scale: SHEET[id] ? 0.8 : RARITY_SCALE[CARD_BY_ID.get(id)?.rarity ?? 'common'] ?? 0.7 };
}

// ─── carregar e desenhar ────────────────────────────────────────────────────

const IMGS = new Map<string, HTMLImageElement | null>();
/** A folha (carrega uma vez; null enquanto não chegou ou se não existe). */
export function sheetImg(id: string): HTMLImageElement | null {
  if (!IMGS.has(id)) {
    IMGS.set(id, null);
    const img = new Image();
    img.onload = () => IMGS.set(id, img);
    img.src = `${import.meta.env.BASE_URL}game/efeitos/${id}.png`;
  }
  return IMGS.get(id) ?? null;
}

/** Quadro `f` com o centro em (x, y), lado `size`, girado `ang`. Diminuir suaviza; aumentar não. */
export function drawFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, f: number, x: number, y: number, size: number, ang = 0, anchorBottom = false) {
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
export function beamCut(img: HTMLImageElement, id: string, f: number): BeamCut | null {
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
export function drawBeam(ctx: CanvasRenderingContext2D, img: HTMLImageElement, id: string, f: number, x: number, y: number, ang: number, len: number, w: number): boolean {
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
