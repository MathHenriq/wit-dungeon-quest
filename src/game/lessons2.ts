// Mais tarefas de profissão sem arte (docs/profissoes-tarefas.md):
//   Fazendeiro: CALENDÁRIO DA HORTA (subtração: plantar para colher na feira)
//   Padeiro: POR QUE A MASSA CRESCE? (experimento: fermento e temperatura)
//   Comerciante: MINHA BARRACA (curva da procura: preço × vendas × lucro)
//   Repórter: FATO OU BOATO (checar manchetes com as pistas do próprio jogo)
//   Dev de Games: LÓGICA DO JOGO (regras SE/ENTÃO de um joguinho)
//   Artista: PIXEL ART (desenho 16×16 que vira quadro)
//   Comerciante: COMPRA E VENDA (tabela de preços: onde comprar para lucrar mais)
// Regras puras (com semente); as telas ficam em components/work/Lessons2.tsx.
import { rng } from './minigames';
import { CROPS, type Crop } from './farm';
import { FISH } from './fishing';
import { PACK_BY_ID } from './packs';

const shuffle = <T,>(r: () => number, a: T[]) => [...a].sort(() => r() - 0.5);

// ─── Calendário da horta ────────────────────────────────────────────────────

export interface CalendarRound { feira: number; crops: Crop[] }
/** 3 rodadas: a feira num dia entre 8 e 12, 3 plantas diferentes cada. */
export function calendarRounds(seed: number): CalendarRound[] {
  const r = rng(seed);
  return [0, 1, 2].map(() => ({ feira: 8 + Math.floor(r() * 5), crops: shuffle(r, CROPS).slice(0, 3) }));
}
/** Dia certo de plantar: colhe no dia da feira (plantar + dias = feira). */
export const plantDay = (feira: number, c: Crop) => feira - c.days;

// ─── Por que a massa cresce? ────────────────────────────────────────────────

export interface Bowl { id: string; fermento: boolean; morna: boolean; label: string; rise: number }
/** O experimento: 4 tigelas. O quanto cada uma cresce em 1 hora (0 a 1). */
export const BOWLS: Bowl[] = [
  { id: 'fm', fermento: true, morna: true, label: 'Fermento + água morna', rise: 1 },
  { id: 'ff', fermento: true, morna: false, label: 'Fermento + água gelada', rise: 0.45 },
  { id: 'sm', fermento: false, morna: true, label: 'Sem fermento + água morna', rise: 0.08 },
  { id: 'sf', fermento: false, morna: false, label: 'Sem fermento + água gelada', rise: 0.04 },
];
/** Nota da previsão: acertou a que cresce mais (metade) e a que cresce menos (metade). */
export function riseScore(most: string, least: string): number {
  const sorted = [...BOWLS].sort((a, b) => b.rise - a.rise);
  return (most === sorted[0].id ? 0.5 : 0) + (least === sorted[sorted.length - 1].id ? 0.5 : 0);
}

// ─── Minha barraca ──────────────────────────────────────────────────────────

/** A procura do dia: quantos compram a cada preço (cai em linha reta) e o custo de fazer. */
export interface Stall { item: string; cost: number; a: number; b: number }
export const sold = (s: Stall, price: number) => Math.max(0, Math.round(s.a - s.b * price));
export const profit = (s: Stall, price: number) => (price - s.cost) * sold(s, price);
/** O preço (inteiro, de 1 a 30) que dá o maior lucro. */
export function bestPrice(s: Stall): { price: number; profit: number } {
  let best = { price: 1, profit: -Infinity };
  for (let p = 1; p <= 30; p++) if (profit(s, p) > best.profit) best = { price: p, profit: profit(s, p) };
  return best;
}
export function stallOf(seed: number): Stall {
  const r = rng(seed);
  const opts: Stall[] = [
    { item: 'pao', cost: 4, a: 30, b: 2.5 },
    { item: 'suco', cost: 3, a: 36, b: 3 },
    { item: 'bolo', cost: 8, a: 24, b: 1 },
    { item: 'pipoca', cost: 2, a: 28, b: 2 },
  ];
  return opts[Math.floor(r() * opts.length)];
}
export const STALL_DAYS = 6;

// ─── Compra e venda ─────────────────────────────────────────────────────────

/** Onde dá para comprar (os preços de compra mudam por lugar) e o preço de venda no Mercado. */
export const TRADE_PLACES = ['Casa de Pesca', 'Barraca da Fazenda', 'Padaria'] as const;
export const TRADE_ITEMS = ['peixe:tilapia', 'ovo', 'leite', 'pao', 'colheita:cenoura', 'colheita:abobora'];
export interface TradeRound { items: string[]; buy: number[][]; sell: number[] }
/** 3 rodadas: 3 itens × 3 lugares; o lucro é venda − compra (pode dar prejuízo). */
export function tradeRounds(seed: number): TradeRound[] {
  const r = rng(seed);
  return [0, 1, 2].map(() => {
    const items = shuffle(r, TRADE_ITEMS).slice(0, 3);
    const sell = items.map(() => 10 + Math.floor(r() * 15));
    const buy = items.map((_, k) => TRADE_PLACES.map(() => Math.max(2, sell[k] - 6 + Math.floor(r() * 10))));
    // sempre há um lucro, e um só é o maior
    const t = { items, buy, sell };
    const b = bestTrade(t);
    if (b.margin <= 0) buy[b.item][b.place] = sell[b.item] - 3;
    const top = bestTrade(t).margin;
    t.items.forEach((_, i) => TRADE_PLACES.forEach((_, p) => { if (margin(t, i, p) === top && (i !== bestTrade(t).item || p !== bestTrade(t).place)) buy[i][p] += 1; }));
    return t;
  });
}
export const margin = (t: TradeRound, item: number, place: number) => t.sell[item] - t.buy[item][place];
export function bestTrade(t: TradeRound): { item: number; place: number; margin: number } {
  let b = { item: 0, place: 0, margin: -Infinity };
  t.items.forEach((_, i) => TRADE_PLACES.forEach((_, p) => { const m = margin(t, i, p); if (m > b.margin) b = { item: i, place: p, margin: m }; }));
  return b;
}

// ─── Fato ou boato ──────────────────────────────────────────────────────────

export interface Claim { text: string; fact: boolean; pista: string }
/** As manchetes do dia: metade fato, metade boato, todas checáveis no próprio jogo. */
export function claims(seed: number): Claim[] {
  const r = rng(seed);
  const night = FISH.find(f => f.night === 'only')!, day = FISH.find(f => !f.night && f.rarity === 'comum')!;
  const pump = CROPS.find(c => c.id === 'abobora')!, carrot = CROPS.find(c => c.id === 'cenoura')!;
  const comum = PACK_BY_ID.get('comum')!;
  const pool: Claim[] = [
    { text: `O ${night.name} só aparece à noite.`, fact: true, pista: 'Álbum da Casa de Pesca.' },
    { text: `O ${day.name} só aparece à noite.`, fact: false, pista: `Álbum da Casa de Pesca: o ${day.name} aparece de dia também.` },
    { text: `A abóbora leva ${pump.days} dias para crescer.`, fact: true, pista: 'Barraca de sementes da Fazenda.' },
    { text: `A cenoura leva ${carrot.days + 4} dias para crescer.`, fact: false, pista: `Barraca de sementes: a cenoura leva ${carrot.days} dias.` },
    { text: `O Pacotinho Comum custa ${comum.price} moedas.`, fact: true, pista: 'Loja de Pacotinhos.' },
    { text: `O Pacotinho Comum custa ${comum.price * 3} moedas.`, fact: false, pista: `Loja de Pacotinhos: custa ${comum.price}.` },
    { text: 'Um deck tem 20 cartas.', fact: true, pista: 'Tela do deck (MEU DECK).' },
    { text: 'Um deck tem 40 cartas.', fact: false, pista: 'Tela do deck: são 20.' },
    { text: 'Para desafiar o chefe, é preciso vencer 4 mesas do andar.', fact: true, pista: 'Placa da Torre.' },
    { text: 'O chefe da Torre libera sem vencer nenhuma mesa.', fact: false, pista: 'Placa da Torre: precisa de 4 mesas.' },
    { text: 'A vida inicial no duelo é 150.', fact: true, pista: 'O placar do duelo.' },
    { text: 'A vida inicial no duelo é 500.', fact: false, pista: 'O placar do duelo: começa com 150.' },
  ];
  // um de cada par, sorteado: 6 manchetes
  const out: Claim[] = [];
  for (let k = 0; k < pool.length; k += 2) out.push(pool[k + (r() < 0.5 ? 0 : 1)]);
  return shuffle(r, out);
}

// ─── Lógica do jogo ─────────────────────────────────────────────────────────

export const GAME_EVENTS = ['encostar no espinho', 'pegar uma moeda', 'cair no buraco', 'chegar na bandeira'] as const;
export const GAME_ACTIONS = ['perde 1 vida', 'ganha 1 ponto', 'volta ao começo da fase', 'passa de fase'] as const;
export type GameEvent = (typeof GAME_EVENTS)[number];
export type GameAction = (typeof GAME_ACTIONS)[number];
/** O "documento do jogo" que o aluno tem que transformar em regras. */
export const GAME_DESIGN: Record<GameEvent, GameAction> = {
  'encostar no espinho': 'perde 1 vida',
  'pegar uma moeda': 'ganha 1 ponto',
  'cair no buraco': 'volta ao começo da fase',
  'chegar na bandeira': 'passa de fase',
};
/** A partida de teste (o herói anda e acontecem estas coisas, em ordem). */
export const TEST_RUN: GameEvent[] = ['pegar uma moeda', 'encostar no espinho', 'pegar uma moeda', 'cair no buraco', 'pegar uma moeda', 'chegar na bandeira'];

export interface RunStep { event: GameEvent; action?: GameAction; lives: number; points: number; pos: number; done: boolean }
/** Roda a partida de teste com as regras do aluno. */
export function runGame(rules: Partial<Record<GameEvent, GameAction>>): RunStep[] {
  let lives = 3, points = 0, pos = 0, done = false;
  const out: RunStep[] = [];
  for (const ev of TEST_RUN) {
    pos++;
    const a = rules[ev];
    if (a === 'perde 1 vida') lives--;
    if (a === 'ganha 1 ponto') points++;
    if (a === 'volta ao começo da fase') pos = 0;
    if (a === 'passa de fase') done = true;
    out.push({ event: ev, action: a, lives, points, pos, done });
  }
  return out;
}
export const rulesRight = (rules: Partial<Record<GameEvent, GameAction>>) => GAME_EVENTS.filter(e => rules[e] === GAME_DESIGN[e]).length;

// ─── Pixel art ──────────────────────────────────────────────────────────────

export const PIX = 16;
/** Paleta de 16 cores (0 = vazio). */
export const PIX_PALETTE = ['', '#1e1b2c', '#ffffff', '#e83a3a', '#ff9a3a', '#ffd84a', '#7ad04a', '#2a9a5a', '#3ad0e8', '#3a78c8', '#7a4ac8', '#e85aa8', '#8a5a2e', '#c8a078', '#9aa0ad', '#4a4660'];
/** Pinta com o balde: troca a cor da área ligada (4 vizinhos). */
export function fill(px: number[], at: number, color: number): number[] {
  const out = [...px], from = px[at];
  if (from === color) return out;
  const stack = [at];
  while (stack.length) {
    const i = stack.pop()!;
    if (out[i] !== from) continue;
    out[i] = color;
    const x = i % PIX, y = Math.floor(i / PIX);
    if (x > 0) stack.push(i - 1);
    if (x < PIX - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - PIX);
    if (y < PIX - 1) stack.push(i + PIX);
  }
  return out;
}
/** Nota do desenho: pelo menos 3 cores e um quarto da tela pintada valem nota cheia. */
export function artScore(px: number[]): number {
  const colors = new Set(px.filter(c => c > 0)).size;
  const filled = px.filter(c => c > 0).length / px.length;
  return Math.min(1, (Math.min(3, colors) / 3) * 0.5 + Math.min(1, filled / 0.25) * 0.5);
}
/** Guardado no progresso como texto curto: um caractere hexadecimal por pixel. */
export const encodeArt = (px: number[]) => px.map(c => c.toString(16)).join('');
export const decodeArt = (s: string) => (/^[0-9a-f]{256}$/.test(s) ? [...s].map(ch => parseInt(ch, 16)) : null);
