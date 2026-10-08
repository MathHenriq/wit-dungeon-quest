// Fazenda: arar, plantar, regar, crescer um estágio por dia regado, colher,
// vender na caixa de envio (paga quando o dia vira), ovos do galinheiro e
// leite das vacas. Funções puras (testadas); o jogo só chama e guarda.
// O dia vira às 6h do relógio do jogo, e também quando o aluno volta depois
// de um tempo fora (no máximo um dia por vez: plantar exige cuidar).

export type CropId = 'cenoura' | 'alface' | 'morango' | 'tomate' | 'milho' | 'abobora' | 'girassol';

export interface Crop {
  id: CropId;
  name: string;
  /** Dias regados até a colheita (= último estágio). */
  days: number;
  seedPrice: number;
  sellPrice: number;
  /** Depois de colher, volta este tanto de dias e dá de novo. */
  regrow?: number;
  about: string;
  /** Estações em que dá para plantar (plantou, cresce até o fim mesmo se a estação virar). */
  seasons: Season[];
}

// ─── estações, chuva e feira (2ª onda da fazenda) ────────────────────────────
export type Season = 'primavera' | 'verao' | 'outono' | 'inverno';
export const SEASONS: Season[] = ['primavera', 'verao', 'outono', 'inverno'];
export const SEASON_NAME: Record<Season, string> = { primavera: 'Primavera', verao: 'Verão', outono: 'Outono', inverno: 'Inverno' };
/** Cada estação dura 7 dias da fazenda. */
export const SEASON_DAYS = 7;
export const seasonOf = (day: number): Season => SEASONS[Math.floor((Math.max(1, day) - 1) / SEASON_DAYS) % 4];
/** Chove neste dia? (sorteio fixo pelo dia: 1 em 4; no verão, 1 em 10). Chuva rega tudo. */
export function rainOn(day: number): boolean {
  let h = Math.imul(day ^ 0x9e3779b9, 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return (h % 100) < (seasonOf(day) === 'verao' ? 10 : 25);
}
/** Sábado (o 6º dia de cada semana da fazenda) é dia de feira: a caixa de envio paga 50% a mais. */
export const isFairDay = (day: number) => day % 7 === 6;
export const FAIR_BONUS = 1.5;
/** Adubo: comprado na barraca de sementes; colheita adubada e sempre regada sai de ouro (rende 2). */
export const ADUBO_PRICE = 6;

export const CROPS: Crop[] = [
  { id: 'cenoura', name: 'Cenoura', days: 3, seedPrice: 2, sellPrice: 5, about: 'Rápida e fácil. Boa para começar!', seasons: ['primavera', 'outono', 'inverno'] },
  { id: 'alface', name: 'Alface', days: 3, seedPrice: 2, sellPrice: 5, about: 'Verdinha e crocante.', seasons: ['primavera', 'outono', 'inverno'] },
  { id: 'morango', name: 'Morango', days: 4, seedPrice: 5, sellPrice: 6, regrow: 2, about: 'Depois de colher, dá de novo a cada 2 dias.', seasons: ['primavera', 'verao'] },
  { id: 'tomate', name: 'Tomate', days: 4, seedPrice: 5, sellPrice: 6, regrow: 2, about: 'Cresce na estaca e dá de novo a cada 2 dias.', seasons: ['verao', 'outono'] },
  { id: 'milho', name: 'Milho', days: 5, seedPrice: 4, sellPrice: 12, about: 'Alto como você! Vira pipoca na festa junina.', seasons: ['verao', 'outono'] },
  { id: 'girassol', name: 'Girassol', days: 4, seedPrice: 3, sellPrice: 9, about: 'Vira para o sol e deixa a fazenda alegre.', seasons: ['verao', 'primavera'] },
  { id: 'abobora', name: 'Abóbora', days: 6, seedPrice: 8, sellPrice: 28, about: 'Demora, mas vale muito. A maior da fazenda!', seasons: ['outono', 'inverno'] },
];
export const CROP_BY_ID = new Map(CROPS.map(c => [c.id, c]));

/** Preço de venda de cada item na caixa de envio (0 = não compra). */
export function sellPrice(item: string): number {
  if (item.startsWith('colheita:')) return CROP_BY_ID.get(item.slice(9) as CropId)?.sellPrice ?? 0;
  if (item.startsWith('fruta:')) return 3;
  if (item === 'ovo') return 4;
  if (item === 'leite') return 7;
  if (item === 'la') return 9;
  return 0;
}
export const ITEM_NAMES: Record<string, string> = {
  ovo: 'Ovo', leite: 'Leite', la: 'Lã', 'fruta:maca': 'Maçã', 'fruta:laranja': 'Laranja', 'fruta:pessego': 'Pêssego', 'fruta:limao': 'Limão',
};
/** Itens que a caixa de envio aceita (o que a fazenda produz). */
export const isFarmItem = (item: string) => sellPrice(item) > 0;
export function itemName(item: string): string {
  if (item.startsWith('colheita:')) return CROP_BY_ID.get(item.slice(9) as CropId)?.name ?? item;
  if (item.startsWith('semente:')) return `Semente de ${CROP_BY_ID.get(item.slice(8) as CropId)?.name ?? item}`;
  return ITEM_NAMES[item] ?? item;
}

export interface Plot {
  /** Molhado hoje. */
  wet: boolean;
  crop?: CropId;
  /** Dias crescidos (0 = semente; `days` = pronto). */
  stage: number;
  /** Dias seguidos sem nada plantado (a terra arada volta a ser grama). */
  idle: number;
  /** Adubado (a colheita pode sair de ouro). */
  adubo?: boolean;
  /** Dias que passou sem água enquanto crescia (0 = sempre regado: colheita de prata ou ouro). */
  dry?: number;
}

export type Quality = 'normal' | 'prata' | 'ouro';
export const QUALITY_NAME: Record<Quality, string> = { normal: '', prata: 'de prata', ouro: 'de ouro' };
/** Qualidade da colheita: sempre regada = prata; e adubada = ouro (rende 2). */
export const qualityOf = (p: Plot): Quality => ((p.dry ?? 0) > 0 ? 'normal' : p.adubo ? 'ouro' : 'prata');

export interface FarmState {
  day: number;
  /** Quando o último dia virou (ms, relógio de verdade). */
  lastDay: number;
  plots: Record<string, Plot>;
  /** Itens na caixa de envio (pagos quando o dia virar). */
  bin: Record<string, number>;
  /** Água no regador. */
  water: number;
  /** Dia em que já pegou os ovos / tirou leite de cada vaca / tosou cada ovelha. */
  eggsDay: number;
  milked: Record<string, number>;
  /** Irrigadores automáticos instalados (cada um rega `IRRIG_PLOTS` canteiros quando o dia vira). */
  irrig: number;
}

export const CAN_SIZE = 20;
/** Regador do fazendeiro nível 6 (20 + 5 por nível). */
export const MAX_CAN = 50;
/** Canteiros que cada irrigador rega por dia, e quantos cabem na fazenda. */
export const IRRIG_PLOTS = 8;
export const MAX_IRRIG = 4;
/** Tempo de verdade de um dia do jogo (12 min: 30 s por hora). */
export const DAY_MS = 12 * 60 * 1000;

export function newFarm(now: number): FarmState {
  return { day: 1, lastDay: now, plots: {}, bin: {}, water: CAN_SIZE, eggsDay: 0, milked: {}, irrig: 0 };
}

/** Fazenda de quem chega pela primeira vez: umas fileiras já aradas com cenoura brotando, para mostrar como é. */
export function starterFarm(now: number, field: { x0: number; y0: number }): FarmState {
  const f = newFarm(now);
  for (let x = 0; x < 6; x++) {
    f.plots[`${field.x0 + 1 + x},${field.y0 + 1}`] = { wet: false, crop: 'cenoura', stage: 1, idle: 0 };
    f.plots[`${field.x0 + 1 + x},${field.y0 + 2}`] = { wet: false, stage: 0, idle: 0 };
  }
  return f;
}

const key = (tx: number, ty: number) => `${tx},${ty}`;

export type Action =
  | { kind: 'arar' }
  | { kind: 'plantar'; crop: CropId }
  | { kind: 'regar' }
  | { kind: 'adubar' }
  | { kind: 'colher'; crop: CropId }
  | { kind: 'encher'; size?: number }
  | { kind: 'nada'; why: string };

/** O que o ESPAÇO faz neste bloco do campo (a ação certa, sem trocar de ferramenta). */
export function actionAt(f: FarmState, tx: number, ty: number, seed: CropId | null, seeds: number, adubos = 0): Action {
  const p = f.plots[key(tx, ty)];
  if (!p) return { kind: 'arar' };
  if (p.crop) {
    const c = CROP_BY_ID.get(p.crop)!;
    if (p.stage >= c.days) return { kind: 'colher', crop: p.crop };
    if (!p.wet) return f.water > 0 ? { kind: 'regar' } : { kind: 'nada', why: 'O regador está vazio. Encha no poço ou na lagoa.' };
    if (!p.adubo && adubos > 0) return { kind: 'adubar' };
    return { kind: 'nada', why: `${c.name}: já regado hoje. Falta${c.days - p.stage > 1 ? 'm' : ''} ${c.days - p.stage} dia${c.days - p.stage > 1 ? 's' : ''}.` };
  }
  if (seed && seeds > 0) {
    const c = CROP_BY_ID.get(seed)!;
    if (!c.seasons.includes(seasonOf(f.day))) return { kind: 'nada', why: `${c.name} não nasce no ${SEASON_NAME[seasonOf(f.day)]}. Dá em: ${c.seasons.map(x => SEASON_NAME[x]).join(', ')}.` };
    return { kind: 'plantar', crop: seed };
  }
  if (!p.wet && f.water > 0) return { kind: 'regar' };
  return { kind: 'nada', why: seed ? 'Sem sementes. Compre na barraca de sementes.' : 'Escolha uma semente embaixo.' };
}

/** Aplica a ação no bloco. Devolve o estado novo e o que foi colhido (se colheu). */
export function applyAction(f: FarmState, tx: number, ty: number, a: Action): { farm: FarmState; harvested?: CropId; quality?: Quality; amount?: number } {
  const k = key(tx, ty);
  const plots = { ...f.plots };
  const p = plots[k] ? { ...plots[k] } : undefined;
  switch (a.kind) {
    case 'arar':
      plots[k] = { wet: false, stage: 0, idle: 0 };
      return { farm: { ...f, plots } };
    case 'plantar':
      if (!p || p.crop) return { farm: f };
      plots[k] = { ...p, crop: a.crop, stage: 0, idle: 0, adubo: false, dry: 0 };
      return { farm: { ...f, plots } };
    case 'adubar':
      if (!p?.crop || p.adubo) return { farm: f };
      plots[k] = { ...p, adubo: true };
      return { farm: { ...f, plots } };
    case 'regar':
      if (!p || p.wet || f.water <= 0) return { farm: f };
      plots[k] = { ...p, wet: true };
      return { farm: { ...f, plots, water: f.water - 1 } };
    case 'colher': {
      if (!p?.crop) return { farm: f };
      const c = CROP_BY_ID.get(p.crop)!;
      if (p.stage < c.days) return { farm: f };
      const quality = qualityOf(p);
      plots[k] = c.regrow ? { ...p, stage: c.days - c.regrow } : { wet: p.wet, stage: 0, idle: 0 };
      return { farm: { ...f, plots }, harvested: p.crop, quality, amount: quality === 'ouro' ? 2 : 1 };
    }
    case 'encher':
      return { farm: { ...f, water: a.size ?? CAN_SIZE } };
    default:
      return { farm: f };
  }
}

/**
 * Vira o dia: planta regada cresce um estágio, a terra seca, a caixa de envio
 * paga, terra arada vazia há 3 dias volta a ser grama.
 */
export function nextDay(f: FarmState, now: number, rain = false, irrigPlots = IRRIG_PLOTS): { farm: FarmState; paid: number; grown: number } {
  const plots: Record<string, Plot> = {};
  let grown = 0;
  for (const [k, p0] of Object.entries(f.plots)) {
    const p = { ...p0 };
    if (p.crop) {
      const c = CROP_BY_ID.get(p.crop)!;
      if ((p.wet || rain) && p.stage < c.days) { p.stage++; grown++; }
      else if (p.stage < c.days) p.dry = (p.dry ?? 0) + 1;
      p.idle = 0;
    } else {
      p.idle++;
      if (p.idle >= 3) continue;
    }
    p.wet = rain;
    plots[k] = p;
  }
  // irrigadores: já deixam regados os canteiros plantados (os que ainda vão crescer)
  let left = f.irrig * irrigPlots;
  for (const p of Object.values(plots)) {
    if (left <= 0) break;
    if (p.crop && !p.wet && p.stage < CROP_BY_ID.get(p.crop)!.days) { p.wet = true; left--; }
  }
  // sábado é dia de feira: a caixa paga 50% a mais
  const raw = Object.entries(f.bin).reduce((s, [id, n]) => s + sellPrice(id) * n, 0);
  const paid = Math.round(raw * (isFairDay(f.day) ? FAIR_BONUS : 1));
  return { farm: { ...f, day: f.day + 1, lastDay: now, plots, bin: {} }, paid, grown };
}

/** Voltando depois de um tempo fora: vira no máximo um dia (quem não regou não ganha nada). */
export function catchUp(f: FarmState, now: number, irrigPlots = IRRIG_PLOTS): { farm: FarmState; paid: number; grown: number } | null {
  if (now - f.lastDay < DAY_MS) return null;
  return nextDay(f, now, rainOn(f.day + 1), irrigPlots);
}

export function sanitizeFarm(raw: unknown, now: number): FarmState {
  const base = newFarm(now);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, d: number, min = 0, max = 1e9) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d);
  const plots: Record<string, Plot> = {};
  if (r.plots && typeof r.plots === 'object') {
    for (const [k, v] of Object.entries(r.plots as Record<string, unknown>)) {
      if (!/^\d{1,3},\d{1,3}$/.test(k) || !v || typeof v !== 'object') continue;
      const p = v as Record<string, unknown>;
      const crop = typeof p.crop === 'string' && CROP_BY_ID.has(p.crop as CropId) ? (p.crop as CropId) : undefined;
      plots[k] = { wet: p.wet === true, crop, stage: crop ? num(p.stage, 0, 0, CROP_BY_ID.get(crop)!.days) : 0, idle: num(p.idle, 0, 0, 9), adubo: p.adubo === true, dry: num(p.dry, 0, 0, 99) };
    }
  }
  const bin: Record<string, number> = {};
  if (r.bin && typeof r.bin === 'object') for (const [k, v] of Object.entries(r.bin as Record<string, unknown>)) if (sellPrice(k) > 0) bin[k] = num(v, 0, 0, 9999);
  const milked: Record<string, number> = {};
  if (r.milked && typeof r.milked === 'object') for (const [k, v] of Object.entries(r.milked as Record<string, unknown>)) if (/^[a-z0-9-]{1,20}$/.test(k)) milked[k] = num(v, 0);
  return {
    day: num(r.day, 1, 1), lastDay: num(r.lastDay, now, 0, now), plots, bin,
    water: num(r.water, CAN_SIZE, 0, MAX_CAN), eggsDay: num(r.eggsDay, 0), milked, irrig: num(r.irrig, 0, 0, MAX_IRRIG),
  };
}

// ─── Navegador ──
const KEY = 'wit.fazenda';
export function loadFarm(now = Date.now(), field?: { x0: number; y0: number }): FarmState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw && field) return starterFarm(now, field);
    return sanitizeFarm(JSON.parse(raw ?? 'null'), now);
  } catch { return newFarm(now); }
}
export function saveFarm(f: FarmState): void {
  try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* sem armazenamento */ }
}
