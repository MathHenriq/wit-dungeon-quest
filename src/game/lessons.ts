// Tarefas que ensinam (uma por profissão), sem arte e sem servidor:
//   Músico: AFINAR (altura do som)        · Artista: MISTURAR CORES (primárias)
//   Técnico de IoT: REGRA SE/ENTÃO        · Entregador: MELHOR ROTA
//   Arquiteto do Metaverso: COORDENADAS   · Treinador de IA: TESTE DO MODELO (acurácia)
// Só regras puras (com semente); as telas ficam em components/work/Lessons.tsx.
import { rng } from './minigames';

const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];
const shuffle = <T,>(r: () => number, a: T[]) => [...a].sort(() => r() - 0.5);

// ─── Músico: afinar ─────────────────────────────────────────────────────────

/** 4 rodadas de "qual é mais aguda?" (a diferença diminui) e 2 de afinar de ouvido. */
export function pitchRounds(seed: number): { compare: { a: number; b: number }[]; tune: { target: number; start: number }[] } {
  const r = rng(seed);
  const compare = [7, 4, 2, 1].map(gap => {
    const base = 57 + Math.floor(r() * 12);
    return r() < 0.5 ? { a: base, b: base + gap } : { a: base + gap, b: base };
  });
  const tune = [0, 1].map(() => {
    const target = 60 + Math.floor(r() * 10);
    const off = (2 + r() * 3) * (r() < 0.5 ? -1 : 1);
    return { target, start: Math.round((target + off) * 10) / 10 };
  });
  return { compare, tune };
}

/** Nota da afinação pela distância em cents (100 cents = 1 semitom). */
export const tuneScore = (cents: number) => { const c = Math.abs(cents); return c <= 15 ? 1 : c <= 35 ? 0.7 : c <= 70 ? 0.35 : 0; };

// ─── Artista: misturar cores (modelo RYB, o das tintas) ─────────────────────

export type Drops = { r: number; y: number; b: number; w: number };
type V3 = [number, number, number];
/** Cantos do cubo RYB → RGB (Gossett e Chen): as cores que as tintas fazem. */
const CORNERS: Record<string, V3> = {
  '000': [1, 1, 1], '100': [0.9, 0.1, 0.1], '010': [1, 0.9, 0.1], '001': [0.15, 0.35, 0.75],
  '110': [1, 0.55, 0.05], '101': [0.5, 0.12, 0.55], '011': [0.1, 0.62, 0.25], '111': [0.25, 0.15, 0.08],
};

/** Mistura as gotas: as proporções de vermelho, amarelo e azul dão a cor; o branco clareia. */
export function mixDrops(d: Drops): V3 {
  const m = Math.max(d.r, d.y, d.b);
  if (m === 0) return d.w ? [1, 1, 1] : [0.93, 0.9, 0.84];
  const [R, Y, B] = [d.r / m, d.y / m, d.b / m];
  const out: V3 = [0, 0, 0];
  for (const k of Object.keys(CORNERS)) {
    const wgt = (k[0] === '1' ? R : 1 - R) * (k[1] === '1' ? Y : 1 - Y) * (k[2] === '1' ? B : 1 - B);
    for (let i = 0; i < 3; i++) out[i] += wgt * CORNERS[k][i];
  }
  const tint = d.w / (d.r + d.y + d.b + d.w);
  return out.map(v => v + (1 - v) * tint * 0.9) as V3;
}
export const colorDist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const toCss = (c: V3) => `rgb(${c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)).join(',')})`;
export const MATCH = 0.06;

export interface ColorGoal { name: string; recipe: Drops; tip: string }
export const COLOR_GOALS: ColorGoal[] = [
  { name: 'LARANJA', recipe: { r: 1, y: 1, b: 0, w: 0 }, tip: 'Laranja é secundária: vermelho + amarelo.' },
  { name: 'VERDE', recipe: { r: 0, y: 1, b: 1, w: 0 }, tip: 'Verde é secundária: amarelo + azul.' },
  { name: 'ROXO', recipe: { r: 1, y: 0, b: 1, w: 0 }, tip: 'Roxo é secundária: vermelho + azul.' },
  { name: 'VERDE-LIMÃO', recipe: { r: 0, y: 2, b: 1, w: 0 }, tip: 'Mais amarelo que azul: 2 de amarelo para 1 de azul.' },
  { name: 'VERMELHO-ALARANJADO', recipe: { r: 2, y: 1, b: 0, w: 0 }, tip: '2 de vermelho para 1 de amarelo.' },
  { name: 'ROSA', recipe: { r: 1, y: 0, b: 0, w: 2 }, tip: 'Rosa é vermelho clareado com branco.' },
  { name: 'AZUL-CÉU', recipe: { r: 0, y: 0, b: 1, w: 2 }, tip: 'Azul com bastante branco.' },
  { name: 'MARROM', recipe: { r: 1, y: 1, b: 1, w: 0 }, tip: 'As três primárias juntas fazem marrom.' },
];
/** 5 cores: as 3 secundárias primeiro (ensina), depois 2 mais difíceis. */
export function colorRounds(seed: number): ColorGoal[] {
  const r = rng(seed);
  return [...COLOR_GOALS.slice(0, 3), ...shuffle(r, COLOR_GOALS.slice(3)).slice(0, 2)];
}
export const colorMatches = (d: Drops, g: ColorGoal) => colorDist(mixDrops(d), mixDrops(g.recipe)) < MATCH;

// ─── Técnico de IoT: regra SE/ENTÃO ─────────────────────────────────────────

export interface Sensor { id: string; name: string; unit: string; conds: { id: string; label: string; test: (v: number) => boolean }[] }
export const SENSORS: Sensor[] = [
  { id: 'umidade', name: 'umidade da terra', unit: '%', conds: [{ id: 'lt30', label: 'menor que 30%', test: v => v < 30 }, { id: 'gt70', label: 'maior que 70%', test: v => v > 70 }] },
  { id: 'luz', name: 'luz do dia', unit: '%', conds: [{ id: 'escuro', label: 'escuro (menor que 20%)', test: v => v < 20 }, { id: 'claro', label: 'claro (maior que 60%)', test: v => v > 60 }] },
  { id: 'presenca', name: 'sensor de presença', unit: '', conds: [{ id: 'sim', label: 'alguém chegou', test: v => v > 0 }, { id: 'nao', label: 'ninguém', test: v => v === 0 }] },
  { id: 'temperatura', name: 'temperatura', unit: '°C', conds: [{ id: 'gt30', label: 'maior que 30°C', test: v => v > 30 }, { id: 'lt15', label: 'menor que 15°C', test: v => v < 15 }] },
];
export const ACTIONS = ['ligar o regador', 'acender a lâmpada', 'tocar a campainha', 'ligar o ventilador'];

export interface RuleTask { place: string; ask: string; sensor: string; cond: string; action: string; readings: number[] }
export const RULE_TASKS: RuleTask[] = [
  { place: 'Horta IoT', ask: 'A horta não pode secar: quando a terra ficar seca, regue.', sensor: 'umidade', cond: 'lt30', action: 'ligar o regador', readings: [55, 42, 28, 18, 75, 31] },
  { place: 'Varanda da casa', ask: 'Quando escurecer, a varanda precisa de luz.', sensor: 'luz', cond: 'escuro', action: 'acender a lâmpada', readings: [90, 65, 35, 15, 5, 80] },
  { place: 'Porta da frente', ask: 'Quando alguém chegar, avise quem está dentro.', sensor: 'presenca', cond: 'sim', action: 'tocar a campainha', readings: [0, 1, 0, 0, 1, 0] },
  { place: 'Estufa da fazenda', ask: 'As plantas da estufa sofrem no calor: refresque quando esquentar demais.', sensor: 'temperatura', cond: 'gt30', action: 'ligar o ventilador', readings: [22, 28, 33, 36, 29, 31] },
];
export function ruleTasks(seed: number): RuleTask[] { return shuffle(rng(seed), RULE_TASKS).slice(0, 3); }

export interface Rule { sensor?: string; cond?: string; action?: string }
/** Roda a regra nas leituras: em cada momento, se ela ligou e se devia ligar. */
export function runRule(t: RuleTask, rule: Rule): { fired: boolean; should: boolean }[] {
  const sensor = SENSORS.find(s => s.id === t.sensor)!;
  const want = sensor.conds.find(c => c.id === t.cond)!;
  const mine = SENSORS.find(s => s.id === rule.sensor)?.conds.find(c => c.id === rule.cond);
  return t.readings.map(v => ({ should: want.test(v), fired: rule.sensor === t.sensor && rule.action === t.action && !!mine && mine.test(v) }));
}
export const ruleOk = (t: RuleTask, rule: Rule) => rule.sensor === t.sensor && rule.cond === t.cond && rule.action === t.action;

// ─── Entregador: melhor rota ────────────────────────────────────────────────

export interface Pt { x: number; y: number }
export const dist = (a: Pt, b: Pt) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
/** Distância da rota: sai da Central, passa por todos na ordem e volta. */
export function routeLength(depot: Pt, stops: Pt[], order: number[]): number {
  let d = 0, at = depot;
  for (const i of order) { d += dist(at, stops[i]); at = stops[i]; }
  return d + dist(at, depot);
}
function perms(n: number): number[][] {
  if (n <= 1) return [[0].slice(0, n)];
  return perms(n - 1).flatMap(p => Array.from({ length: n }, (_, k) => [...p.slice(0, k), n - 1, ...p.slice(k)]));
}
export function bestRoute(depot: Pt, stops: Pt[]): { order: number[]; len: number } {
  let best = { order: [] as number[], len: Infinity };
  for (const o of perms(stops.length)) { const len = routeLength(depot, stops, o); if (len < best.len) best = { order: o, len }; }
  return best;
}
/** 3 mapas (3, 4 e 5 casas) num quadriculado 10 × 7; a Central fica num canto diferente a cada um. */
export function routeRounds(seed: number): { depot: Pt; stops: Pt[] }[] {
  const r = rng(seed);
  return [3, 4, 5].map(n => {
    const depot = pick(r, [{ x: 0, y: 0 }, { x: 9, y: 6 }, { x: 0, y: 6 }, { x: 9, y: 0 }]);
    const stops: Pt[] = [];
    while (stops.length < n) {
      const p = { x: Math.floor(r() * 10), y: Math.floor(r() * 7) };
      if (dist(p, depot) >= 2 && stops.every(s => dist(s, p) >= 2)) stops.push(p);
    }
    return { depot, stops };
  });
}
/** Nota: rota ótima = 1; quanto mais comprida, menos. */
export const routeScore = (len: number, best: number) => Math.max(0, Math.min(1, 1 - (len - best) / best * 2));

// ─── Arquiteto do Metaverso: coordenadas X, Y, Z ────────────────────────────

export interface P3 { x: number; y: number; z: number }
export const GRID3 = 5, ZMAX = 3;
/** 5 rodadas: 3 de "ponha o bloco em (x, y, z)" e 2 de "qual é a coordenada deste bloco?". */
export function coordRounds(seed: number): { kind: 'por' | 'ler'; p: P3; options?: P3[]; answer?: number }[] {
  const r = rng(seed);
  const rnd = (zmax = ZMAX): P3 => ({ x: Math.floor(r() * GRID3), y: Math.floor(r() * GRID3), z: Math.floor(r() * (zmax + 1)) });
  const out: { kind: 'por' | 'ler'; p: P3; options?: P3[]; answer?: number }[] = [
    { kind: 'por', p: { ...rnd(0), z: 0 } }, { kind: 'por', p: rnd(1) }, { kind: 'por', p: rnd() },
  ];
  for (let k = 0; k < 2; k++) {
    const p = rnd();
    // as erradas trocam x com y (o erro mais comum) ou mudam a altura
    const wrong: P3[] = [{ x: p.y, y: p.x, z: p.z }, { x: p.x, y: p.y, z: (p.z + 1 + Math.floor(r() * ZMAX)) % (ZMAX + 1) }, { x: (p.x + 2) % GRID3, y: p.y, z: p.z }]
      .filter(w => w.x !== p.x || w.y !== p.y || w.z !== p.z);
    const options = shuffle(r, [p, ...wrong.slice(0, 2)]);
    out.push({ kind: 'ler', p, options, answer: options.indexOf(p) });
  }
  return out;
}
export const sameP3 = (a: P3, b: P3) => a.x === b.x && a.y === b.y && a.z === b.z;

// ─── Treinador de IA: teste do modelo (acurácia) ────────────────────────────

export const FRUITS = ['fruta:maca', 'banana', 'uva', 'colheita:morango', 'abacaxi', 'pera', 'cereja', 'melancia', 'fruta:laranja'];
export const VEGGIES = ['colheita:cenoura', 'rabanete', 'pimentao', 'colheita:alface', 'colheita:milho', 'colheita:abobora'];
export type Label = 'FRUTA' | 'LEGUME';
export const truth = (icon: string): Label => (FRUITS.includes(icon) ? 'FRUTA' : 'LEGUME');

export interface ModelTest {
  /** Exemplos do treino: 2 estão com a etiqueta errada (os culpados). */
  train: { icon: string; label: Label }[];
  bad: number[];
  /** O teste: 10 itens; antes e depois de consertar o treino. */
  test: string[];
  before: Label[];
  after: Label[];
}
/** Antes: 7 de 10 certos (70%). Depois de trocar as 2 etiquetas ruins: 9 de 10 (90%). */
export function modelTest(seed: number): ModelTest {
  const r = rng(seed);
  const fr = shuffle(r, FRUITS), vg = shuffle(r, VEGGIES);
  const train = shuffle(r, [...fr.slice(0, 4), ...vg.slice(0, 4)]).map(icon => ({ icon, label: truth(icon) }));
  const bad = [train.findIndex(t => t.label === 'FRUTA'), train.findIndex(t => t.label === 'LEGUME')];
  for (const i of bad) train[i] = { ...train[i], label: train[i].label === 'FRUTA' ? 'LEGUME' : 'FRUTA' };
  const test = shuffle(r, [...fr.slice(4, 9), ...vg.slice(1, 6)]).slice(0, 10);
  const flip = (l: Label): Label => (l === 'FRUTA' ? 'LEGUME' : 'FRUTA');
  const wrongBefore = new Set(shuffle(r, test.map((_, i) => i)).slice(0, 3));
  const wrongAfter = [...wrongBefore][0];
  return {
    train, bad, test,
    before: test.map((t, i) => (wrongBefore.has(i) ? flip(truth(t)) : truth(t))),
    after: test.map((t, i) => (i === wrongAfter ? flip(truth(t)) : truth(t))),
  };
}
export const accuracy = (test: string[], pred: Label[]) => Math.round((pred.filter((p, i) => p === truth(test[i])).length / test.length) * 100);
