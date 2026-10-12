// Rádio WIT (plano §3.7, Estúdio de Comunicação): a trilha da cidade. Toca
// as músicas que os alunos compuseram no Estúdio de Música, intercaladas com
// três vinhetas da casa. Cada música toca 4 voltas (64 tempos) e passa.
import type { Song } from './music';

const grid = (pairs: [number, number[]][]) => {
  const g: number[][] = Array.from({ length: 16 }, () => []);
  for (const [t, rows] of pairs) g[t] = rows;
  return g;
};

/** Vinhetas da rádio (escala pentatônica, como no compositor). */
export const RADIO_SONGS: Song[] = [
  { id: 'radio-manha', nome: 'Bom dia, Cidade WIT', inst: 'xilofone', bpm: 104,
    notas: grid([[0, [0]], [2, [2]], [4, [4]], [6, [3]], [8, [5]], [10, [4]], [12, [2]], [14, [3]]]),
    bateria: grid([[0, [0]], [4, [1]], [8, [0]], [12, [1]], [2, [2]], [6, [2]], [10, [2]], [14, [2]]]) },
  { id: 'radio-praca', nome: 'Passeio na Praça', inst: 'violao', bpm: 96,
    notas: grid([[0, [2, 4]], [3, [3]], [6, [4]], [8, [1, 3]], [11, [2]], [14, [0]]]),
    bateria: grid([[0, [0]], [8, [0]], [4, [3]], [12, [3]]]) },
  { id: 'radio-noite', nome: 'Luzes da Torre', inst: 'teclado', bpm: 88,
    notas: grid([[0, [5]], [4, [4]], [8, [6]], [12, [3]], [2, [1]], [10, [2]]]),
    bateria: grid([[0, [0]], [8, [1]]]) },
];

/**
 * Música da cidade: o tema de cada área, gerado da mesma semente (cada área
 * tem a sua melodia) e com o clima da hora: de dia mais rápido e alegre, de
 * noite mais lento, no teclado e com menos bateria.
 */
export const AREA_NAMES: Record<string, string> = { cidade: 'Centro', lago: 'Lago Azul', fazenda: 'Fazenda do Vale', wit: 'Cidade WIT' };
export function areaTheme(zone: string, hour: number): Song {
  let h = 2166136261;
  for (const c of zone) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  const night = hour >= 19 || hour < 6;
  const inst = night ? 'teclado' : (['xilofone', 'violao', 'flauta', 'teclado'] as const)[Math.floor(rnd() * 4)];
  const notas: number[][] = Array.from({ length: 16 }, () => []);
  // melodia que anda por graus vizinhos (soa como música, não como sorteio)
  let n = 2 + Math.floor(rnd() * 3);
  for (let t = 0; t < 16; t += rnd() < 0.7 ? 2 : 1) {
    n = Math.max(0, Math.min(7, n + (rnd() < 0.5 ? -1 : 1) * (rnd() < 0.75 ? 1 : 2)));
    notas[t] = t % 8 === 0 ? [n, Math.max(0, n - 2)] : [n];
  }
  const bateria: number[][] = Array.from({ length: 16 }, (_, t) => (t % 8 === 0 ? [0] : !night && t % 8 === 4 ? [1] : !night && t % 2 === 0 ? [2] : []));
  return { id: `tema-${zone}-${night ? 'noite' : 'dia'}`, nome: `Tema: ${AREA_NAMES[zone] ?? zone}${night ? ' (noite)' : ''}`, inst, bpm: night ? 80 : 100 + Math.floor(rnd() * 12), notas, bateria };
}

/** A fila da rádio: o tema da área, músicas dos alunos (as mais novas primeiro) entre as vinhetas. */
export function playlist(alunos: Song[], theme?: Song): Song[] {
  const out: Song[] = theme ? [theme] : [];
  const mine = alunos.slice(0, 12);
  for (let i = 0; i < Math.max(mine.length, RADIO_SONGS.length); i++) {
    if (i < RADIO_SONGS.length) out.push(RADIO_SONGS[i]);
    if (i < mine.length) out.push(mine[i]);
    if (theme && i % 2 === 1) out.push(theme);
  }
  return out;
}

/** Tempos de cada música antes de passar para a próxima. */
export const RADIO_STEPS = 64;
