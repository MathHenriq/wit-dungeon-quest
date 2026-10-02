// Grimório (os antigos "talentos", plano §5.4): pequeno, no máximo o peso de
// uma carta Comum. Os pontos vêm da Torre (1 a cada 2 andares) e cada
// talento custa 1 a 3. Três ramos: Coleção, Estilo e Duelo. Nada de +dano ou
// +vida que decida uma partida.
import type { Progress } from './progress';

export type GrimId = 'deck-extra' | 'po-extra' | 'verso-dourado' | 'verso-noite' | 'espiar' | 'nova-mao';
export type Branch = 'colecao' | 'estilo' | 'duelo';
export interface Talent { id: GrimId; branch: Branch; name: string; about: string; cost: number; needs?: GrimId }

export const BRANCH_NAME: Record<Branch, string> = { colecao: 'COLEÇÃO', estilo: 'ESTILO', duelo: 'DUELO' };
export const GRIMOIRE: Talent[] = [
  { id: 'deck-extra', branch: 'colecao', name: 'Estojo Extra', about: '+1 deck salvo (4 em vez de 3).', cost: 2 },
  { id: 'po-extra', branch: 'colecao', name: 'Martelo do Ferreiro', about: 'Desmanchar carta repetida na forja dá 25% a mais de pó.', cost: 3, needs: 'deck-extra' },
  { id: 'verso-dourado', branch: 'estilo', name: 'Verso Dourado', about: 'O verso das suas cartas fica dourado.', cost: 1 },
  { id: 'verso-noite', branch: 'estilo', name: 'Verso Estrelado', about: 'O verso das suas cartas vira um céu de estrelas.', cost: 1 },
  { id: 'nova-mao', branch: 'duelo', name: 'Embaralhar de Novo', about: 'Uma vez por partida, antes de jogar qualquer carta no 1º turno: devolve a mão, embaralha e compra outra.', cost: 2 },
  { id: 'espiar', branch: 'duelo', name: 'Olho do Oráculo', about: 'Uma vez por partida: olhe a carta do topo do seu deck.', cost: 3, needs: 'nova-mao' },
];
export const TALENT_BY_ID = new Map(GRIMOIRE.map(t => [t.id, t]));

/** Pontos ganhos: 1 a cada 2 andares da Torre (o andar 1 não conta). */
/** Pontos: 1 a cada 2 andares da Torre + os pontos de talento que vieram do WIT 1. */
export const grimoirePoints = (p: Pick<Progress, 'towerMax'> & Partial<Pick<Progress, 'legado'>>) => Math.floor((p.towerMax - 1) / 2) + (p.legado?.pontos ?? 0);
export const spentPoints = (p: Pick<Progress, 'grimorio'>) => p.grimorio.reduce((s, id) => s + (TALENT_BY_ID.get(id)?.cost ?? 0), 0);
export const freePoints = (p: Pick<Progress, 'towerMax' | 'grimorio'> & Partial<Pick<Progress, 'legado'>>) => grimoirePoints(p) - spentPoints(p);
export const hasTalent = (p: Pick<Progress, 'grimorio'>, id: GrimId) => p.grimorio.includes(id);

export function learn(p: Progress, id: GrimId): { progress: Progress } | { reason: string } {
  const t = TALENT_BY_ID.get(id);
  if (!t) return { reason: 'Talento não existe.' };
  if (hasTalent(p, id)) return { reason: 'Você já tem esse talento.' };
  if (t.needs && !hasTalent(p, t.needs)) return { reason: `Primeiro aprenda ${TALENT_BY_ID.get(t.needs)!.name}.` };
  if (freePoints(p) < t.cost) return { reason: `Faltam ${t.cost - freePoints(p)} pontos. Suba na Torre para ganhar mais (1 a cada 2 andares).` };
  return { progress: { ...p, grimorio: [...p.grimorio, id] } };
}

/** O verso de carta que o aluno usa (só os que ele tem). */
export type Verso = 'classico' | 'dourado' | 'noite';
export function versoOf(p: Pick<Progress, 'grimorio' | 'verso'>): Verso {
  if (p.verso === 'dourado' && hasTalent(p, 'verso-dourado')) return 'dourado';
  if (p.verso === 'noite' && hasTalent(p, 'verso-noite')) return 'noite';
  return 'classico';
}
export const deckSlots = (p: Pick<Progress, 'grimorio'>) => (hasTalent(p, 'deck-extra') ? 4 : 3);
