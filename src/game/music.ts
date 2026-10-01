// Estúdio de Música: a música que o aluno compõe numa grade (16 tempos × 8
// notas + 4 batidas de bateria). As notas são da escala pentatônica (dó, ré,
// mi, sol, lá): qualquer combinação soa bem, então a criança experimenta à
// vontade. A música vira um Disco com o nome que o aluno der. Regras puras;
// o som fica em src/components/work/synth.ts.

export type InstrumentId = 'teclado' | 'violao' | 'flauta' | 'xilofone';
export const INSTRUMENTS: { id: InstrumentId; name: string; icon: string }[] = [
  { id: 'teclado', name: 'Teclado', icon: 'inst-teclado' },
  { id: 'violao', name: 'Violão', icon: 'inst-violao' },
  { id: 'flauta', name: 'Flauta', icon: 'inst-flauta' },
  { id: 'xilofone', name: 'Xilofone', icon: 'inst-xilofone' },
];

export const STEPS = 16;
/** Notas da grade, da mais aguda (em cima) para a mais grave: pentatônica de dó em duas oitavas. */
export const NOTES = [
  { name: 'MI', midi: 76 }, { name: 'RÉ', midi: 74 }, { name: 'DÓ', midi: 72 },
  { name: 'LÁ', midi: 69 }, { name: 'SOL', midi: 67 }, { name: 'MI', midi: 64 },
  { name: 'RÉ', midi: 62 }, { name: 'DÓ', midi: 60 },
];
export const DRUMS = ['BUMBO', 'CAIXA', 'CHIMBAL', 'PALMA'] as const;

export interface Song {
  id: string;
  nome: string;
  inst: InstrumentId;
  bpm: number;
  /** notas[tempo] = linhas da grade de notas ligadas naquele tempo. */
  notas: number[][];
  /** bateria[tempo] = batidas ligadas naquele tempo. */
  bateria: number[][];
}

export const emptySong = (): Omit<Song, 'id' | 'nome'> => ({
  inst: 'teclado', bpm: 110,
  notas: Array.from({ length: STEPS }, () => []),
  bateria: Array.from({ length: STEPS }, () => []),
});

/** Quantas notas e batidas a música tem (para a nota e para não salvar música vazia). */
export const songSize = (s: Pick<Song, 'notas' | 'bateria'>) =>
  s.notas.reduce((a, x) => a + x.length, 0) + s.bateria.reduce((a, x) => a + x.length, 0);

/**
 * Uma nota de 0 a 1 para a música (para o XP e o disco de ouro): premia usar
 * as duas camadas, variar as notas e deixar espaço (nem vazia, nem cheia).
 */
export function songScore(s: Pick<Song, 'notas' | 'bateria'>): number {
  const n = s.notas.reduce((a, x) => a + x.length, 0), d = s.bateria.reduce((a, x) => a + x.length, 0);
  if (!n && !d) return 0;
  const distinct = new Set(s.notas.flat()).size;
  const used = s.notas.filter(x => x.length).length;
  const density = (n + d) / (STEPS * (NOTES.length + DRUMS.length));
  const variety = Math.min(1, distinct / 5);
  const rhythm = d ? Math.min(1, d / 8) : 0;
  const melody = Math.min(1, used / 10);
  const space = density > 0.45 ? 0.5 : 1;   // tudo ligado vira barulho
  return Math.round(Math.min(1, (variety * 0.35 + rhythm * 0.3 + melody * 0.35) * space) * 100) / 100;
}

const ok = (v: unknown, max: number) => Array.isArray(v) && v.length === STEPS
  && v.every(x => Array.isArray(x) && x.every(y => Number.isInteger(y) && y >= 0 && y < max));

export function sanitizeSong(raw: unknown): Song | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.nome !== 'string') return null;
  if (!INSTRUMENTS.some(i => i.id === r.inst)) return null;
  if (!ok(r.notas, NOTES.length) || !ok(r.bateria, DRUMS.length)) return null;
  const bpm = typeof r.bpm === 'number' ? Math.max(70, Math.min(160, Math.round(r.bpm))) : 110;
  return { id: r.id.slice(0, 24), nome: r.nome.slice(0, 24), inst: r.inst as InstrumentId, bpm, notas: r.notas as number[][], bateria: r.bateria as number[][] };
}
