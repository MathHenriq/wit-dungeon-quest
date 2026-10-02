// Comerciante: "Ler o gráfico". O preço normal de cada item no Mercado muda
// todo dia pela procura (market.ts `demand`, igual para todos). Daqui saem a
// série de preços dos últimos dias e as perguntas de leitura de gráfico
// (maior valor, subiu ou desceu, mais estável, média e o que esperar amanhã).
import { demand } from './market';
import { itemDef } from './items';
import { rng } from './minigames';

/** Itens do gráfico: os que todo mundo conhece e vende. */
export const CHART_ITEMS = ['pao', 'leite', 'ovo', 'la', 'bolo', 'disco', 'quadro', 'sensor', 'modelo-ia', 'cubo-virtual'];

/** Preço normal do dia (sem o mercado cheio e sem bônus): base × procura. */
export const dayPrice = (item: string, day: number) => Math.max(1, Math.round((itemDef(item)?.price ?? 0) * demand(item, day)));

/** Preços dos últimos `n` dias, do mais velho até hoje. */
export const priceSeries = (item: string, day: number, n = 10) => Array.from({ length: n }, (_, k) => dayPrice(item, day - (n - 1) + k));

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
/** Variação relativa: (maior − menor) ÷ média. */
export const spread = (xs: number[]) => (Math.max(...xs) - Math.min(...xs)) / mean(xs);

export type ChartQuestion =
  | { kind: 'pico'; item: string; series: number[]; answer: number; text: string }
  | { kind: 'direcao'; item: string; series: number[]; answer: 'subiu' | 'desceu'; text: string }
  | { kind: 'estavel'; items: string[]; series: number[][]; answer: number; text: string }
  | { kind: 'media'; item: string; series: number[]; options: number[]; answer: number; text: string }
  | { kind: 'amanha'; item: string; series: number[]; tomorrow: number; answer: 'sobe' | 'desce'; text: string };

/**
 * As 5 perguntas do dia. As respostas saem dos próprios números (nada
 * inventado). Na de amanhã, o item escolhido está longe do normal hoje e o
 * preço de amanhã (já sorteado pela procura) volta para o meio: a lição é a
 * "volta à média".
 */
export function chartQuiz(day: number, seed: number): ChartQuestion[] {
  const r = rng(seed);
  const pool = [...CHART_ITEMS].sort(() => r() - 0.5);
  const qs: ChartQuestion[] = [];
  const name = (i: string) => itemDef(i)!.name;

  // 1) o dia mais caro (sem empate no topo)
  const pi = pool.find(i => { const s = priceSeries(i, day); return s.filter(v => v === Math.max(...s)).length === 1; }) ?? pool[0];
  const ps = priceSeries(pi, day);
  qs.push({ kind: 'pico', item: pi, series: ps, answer: ps.indexOf(Math.max(...ps)), text: `${name(pi)}: em que dia o preço esteve MAIS ALTO? Toque no ponto.` });

  // 2) de ontem para hoje (sem empate)
  const di = pool.find(i => i !== pi && dayPrice(i, day) !== dayPrice(i, day - 1)) ?? pool[1];
  const ds = priceSeries(di, day);
  qs.push({ kind: 'direcao', item: di, series: ds, answer: ds[9] > ds[8] ? 'subiu' : 'desceu', text: `${name(di)}: de ontem para hoje, o preço subiu ou desceu?` });

  // 3) o mais estável entre 3 (com folga, para não ser no olho)
  for (let t = 0; t < 20; t++) {
    const three = [...CHART_ITEMS].sort(() => r() - 0.5).slice(0, 3);
    const ss = three.map(i => priceSeries(i, day));
    const sp = ss.map(spread), best = sp.indexOf(Math.min(...sp));
    const sorted = [...sp].sort((a, b) => a - b);
    if (sorted[1] - sorted[0] > 0.08 || t === 19) {
      qs.push({ kind: 'estavel', items: three, series: ss, answer: best, text: 'Qual destes preços foi o MAIS ESTÁVEL (mudou menos)? Os três estão na mesma escala: 100 = a média de cada um.' });
      break;
    }
  }

  // 4) a média dos últimos 7 dias
  const mi = pool.find(i => i !== pi && i !== di && (itemDef(i)?.price ?? 0) >= 9) ?? pool[2];
  const ms = priceSeries(mi, day, 7), m = Math.round(mean(ms));
  const opts = [...new Set([m, Math.round(m * 1.35), Math.max(1, Math.round(m * 0.7))])];
  while (opts.length < 3) opts.push(opts[opts.length - 1] + 3);
  const options = opts.sort(() => r() - 0.5);
  qs.push({ kind: 'media', item: mi, series: ms, options, answer: options.indexOf(m), text: `${name(mi)}: mais ou menos, qual foi a MÉDIA do preço nesta semana?` });

  // 5) amanhã: o item mais longe do normal hoje, e que amanhã volta para o meio
  const cand = CHART_ITEMS.map(i => {
    const base = itemDef(i)!.price;
    const d = demand(i, day) - 1.05;   // 1,05 = meio da procura
    const t = dayPrice(i, day + 1), h = dayPrice(i, day);
    const back = (d > 0 && t < h) || (d < 0 && t > h);
    return { i, d: Math.abs(d), back, base };
  }).filter(c => c.back && c.base >= 4).sort((a, b) => b.d - a.d);
  const ai = cand[0]?.i ?? pool[3];
  const as = priceSeries(ai, day), tomorrow = dayPrice(ai, day + 1);
  qs.push({ kind: 'amanha', item: ai, series: as, tomorrow, answer: tomorrow > as[9] ? 'sobe' : 'desce',
    text: `${name(ai)}: hoje o preço está ${demand(ai, day) > 1.05 ? 'BEM ACIMA' : 'BEM ABAIXO'} do normal. Amanhã, o que é mais provável?` });
  return qs;
}

/** Nome do dia no eixo: "hoje", "ontem", "-2"... */
export const dayLabel = (k: number, n: number) => (k === n - 1 ? 'hoje' : k === n - 2 ? 'ontem' : `-${n - 1 - k}`);
