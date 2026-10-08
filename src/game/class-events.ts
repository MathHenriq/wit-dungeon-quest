// Eventos da turma: VOTAÇÃO do tema da próxima coleção (o professor abre com
// 2 a 4 temas da lista pronta; cada aluno 1 voto, pode trocar enquanto está
// aberta) e CARTA DA AULA (o professor escolhe entre 3 sugestões da semana;
// quem não faltou ganha 1 cópia). Servidor: _wit2_events.sql. Sem o banco,
// `?social=demo` mostra dados de mentira.
import { CATALOG } from '@/lib/tcg/cards/catalog';
import { cloudEnabled, rpc, rpcTeacher } from './cloud';
import { socialDemo } from './social';

/** Temas que dá para votar (o servidor só aceita ids assim: minúsculas e hífen). */
export const VOTE_THEMES = [
  { id: 'dragoes', label: 'Dragões' }, { id: 'robos', label: 'Robôs e máquinas' }, { id: 'oceano', label: 'Fundo do mar' },
  { id: 'espaco', label: 'Espaço sideral' }, { id: 'dinossauros', label: 'Dinossauros' }, { id: 'magia', label: 'Escola de magia' },
  { id: 'esportes', label: 'Esportes' }, { id: 'musica', label: 'Música' }, { id: 'folclore', label: 'Folclore brasileiro' },
  { id: 'cavaleiros', label: 'Cavaleiros e castelos' }, { id: 'floresta', label: 'Floresta encantada' }, { id: 'cidade-futuro', label: 'Cidade do futuro' },
] as const;
export type ThemeId = (typeof VOTE_THEMES)[number]['id'];
export const themeLabel = (id: string) => VOTE_THEMES.find(t => t.id === id)?.label ?? id;

export interface Vote { id: number; options: string[]; ends: string; aberta: boolean; votos: Record<string, number>; total: number; meu?: string | null }

/** O tema que está ganhando (empate: o que veio primeiro na lista da votação). */
export function leader(v: Pick<Vote, 'options' | 'votos'>): string | null {
  let best: string | null = null, n = 0;
  for (const o of v.options) if ((v.votos[o] ?? 0) > n) { best = o; n = v.votos[o]; }
  return best;
}
export const votePct = (v: Pick<Vote, 'votos' | 'total'>, o: string) => (v.total ? Math.round(((v.votos[o] ?? 0) / v.total) * 100) : 0);

// ─── Carta da Aula ──────────────────────────────────────────────────────────

/** Semana do ano (segunda a domingo), para as sugestões mudarem toda semana. */
export function weekOf(d = new Date()): number {
  const t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((t / 86_400_000 + 3) / 7);
}
const LESSON_POOL = CATALOG.filter(c => c.rarity === 'common' || c.rarity === 'uncommon' || c.rarity === 'rare');
/** 3 sugestões da semana: uma Comum, uma Incomum e uma Rara (sempre as mesmas na mesma semana). */
export function weekCards(week: number): string[] {
  const pick = (r: string, k: number) => {
    const pool = LESSON_POOL.filter(c => c.rarity === r);
    const x = Math.sin(week * 12.9898 + k * 78.233) * 43758.5453;
    return pool[Math.floor((x - Math.floor(x)) * pool.length)].id;
  };
  return [pick('common', 1), pick('uncommon', 2), pick('rare', 3)];
}

// ─── servidor ───────────────────────────────────────────────────────────────

const live = () => cloudEnabled();
let demoVote: Vote = { id: 1, options: ['dragoes', 'robos', 'oceano'], ends: new Date(Date.now() + 2 * 86_400_000).toISOString(), aberta: true, votos: { dragoes: 7, robos: 9, oceano: 4 }, total: 20, meu: null };

export const currentVote = (): Promise<Vote | null> =>
  live() ? rpc<Vote | null>('wit2_vote_current') : Promise.resolve(socialDemo() ? demoVote : null);
export function castVote(id: number, choice: string): Promise<Vote> {
  if (live()) return rpc<Vote>('wit2_vote_cast', { p_vote: id, p_choice: choice });
  const votos = { ...demoVote.votos };
  if (demoVote.meu) votos[demoVote.meu]--;
  votos[choice] = (votos[choice] ?? 0) + 1;
  demoVote = { ...demoVote, votos, total: demoVote.total + (demoVote.meu ? 0 : 1), meu: choice };
  return Promise.resolve(demoVote);
}
export const lessonCardsMine = () => (live() ? rpc<{ card: string; day: string }[]>('wit2_lesson_cards_mine').catch(() => []) : Promise.resolve([]));

// professor
let demoTeacherVotes: Vote[] = [{ ...demoVote }, { id: 0, options: ['magia', 'espaco'], ends: new Date(Date.now() - 5 * 86_400_000).toISOString(), aberta: false, votos: { magia: 11, espaco: 8 }, total: 19 }];
export const teacherVotes = () => (live() ? rpcTeacher<Vote[]>('wit2_teacher_votes') : Promise.resolve(demoTeacherVotes));
export function openVote(options: string[], days: number): Promise<number> {
  if (live()) return rpcTeacher<number>('wit2_teacher_vote_open', { p_options: options, p_days: days });
  demoTeacherVotes = [{ id: Date.now(), options, ends: new Date(Date.now() + days * 86_400_000).toISOString(), aberta: true, votos: {}, total: 0 }, ...demoTeacherVotes.map(v => ({ ...v, aberta: false }))];
  return Promise.resolve(demoTeacherVotes[0].id);
}
export function closeVote(id: number): Promise<boolean> {
  if (live()) return rpcTeacher<boolean>('wit2_teacher_vote_close', { p_id: id });
  demoTeacherVotes = demoTeacherVotes.map(v => (v.id === id ? { ...v, aberta: false } : v));
  return Promise.resolve(true);
}
/** Grava a Carta da Aula e entrega a quem veio. Devolve quantos ganharam. */
export const giveLessonCard = (lesson: string, card: string) => rpcTeacher<number>('wit2_teacher_lesson_card', { p_lesson: lesson, p_card: card });
