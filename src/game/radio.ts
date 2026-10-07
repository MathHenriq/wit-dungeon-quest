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

/** A fila da rádio: músicas dos alunos (as mais novas primeiro) entre as vinhetas. */
export function playlist(alunos: Song[]): Song[] {
  const out: Song[] = [];
  const mine = alunos.slice(0, 12);
  for (let i = 0; i < Math.max(mine.length, RADIO_SONGS.length); i++) {
    if (i < RADIO_SONGS.length) out.push(RADIO_SONGS[i]);
    if (i < mine.length) out.push(mine[i]);
  }
  return out;
}

/** Tempos de cada música antes de passar para a próxima. */
export const RADIO_STEPS = 64;
