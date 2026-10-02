// Títulos por conquista: aparecem na plaquinha sobre o personagem. Cada um
// tem uma regra sobre o progresso (Torre, coleção, pesca, profissões,
// matérias, Grimório). O aluno escolhe qual mostrar entre os que já ganhou.
import { FISH } from './fishing';
import { levelOf, PROFESSIONS } from './professions';
import type { Progress } from './progress';
import { GRIMOIRE } from './grimoire';
import { PATH_BY_ID } from '@/lib/tcg/paths';

export interface TitleDef { id: string; name: string; how: string; has: (p: Progress) => boolean; progress?: (p: Progress) => [number, number]; /** Só do WIT 1: aparece só para quem tem. */ legacy?: boolean }

const unique = (p: Progress) => Object.values(p.collection).filter(n => n > 0).length;
const realFish = FISH.filter(f => f.rarity !== 'lixo');
const caught = (p: Progress) => realFish.filter(f => p.recordes[f.id]).length;
const bestProf = (p: Progress) => Math.max(1, ...PROFESSIONS.map(x => levelOf(p.xp[x.id] ?? 0).level));
const bosses = (p: Progress) => Object.keys(p.wins).filter(k => k.endsWith('-chefe')).length;
const stat = (p: Progress, k: string) => p.stats[k] ?? 0;
const at = (n: number, v: (p: Progress) => number) => ({ has: (p: Progress) => v(p) >= n, progress: (p: Progress) => [Math.min(n, v(p)), n] as [number, number] });

export const TITLES_LIST: TitleDef[] = [
  { id: 'novato', name: 'Novato', how: 'Todo mundo começa assim.', has: () => true },
  { id: 'caminho', name: 'Seguidor do Caminho', how: 'Escolher o seu Caminho.', has: p => !!p.caminho },
  { id: 'escalador', name: 'Escalador', how: 'Chegar ao andar 10 da Torre.', ...at(10, p => p.towerMax) },
  { id: 'alpinista', name: 'Alpinista', how: 'Chegar ao andar 30 da Torre.', ...at(30, p => p.towerMax) },
  { id: 'mestre-torre', name: 'Mestre da Torre', how: 'Chegar ao andar 60 da Torre.', ...at(60, p => p.towerMax) },
  { id: 'lenda-torre', name: 'Lenda da Torre', how: 'Chegar ao andar 100 da Torre.', ...at(100, p => p.towerMax) },
  { id: 'cacador', name: 'Caçador de Chefes', how: 'Vencer 10 chefes diferentes.', ...at(10, bosses) },
  { id: 'colecionador', name: 'Colecionador', how: 'Ter 50 cartas diferentes.', ...at(50, unique) },
  { id: 'enciclopedia', name: 'Enciclopédia', how: 'Ter 150 cartas diferentes.', ...at(150, unique) },
  { id: 'pescador', name: 'Pescador de Primeira', how: 'Pescar 8 tipos de peixe.', ...at(8, caught) },
  { id: 'rei-lago', name: 'Rei do Lago', how: `Pescar todos os ${realFish.length} peixes do lago.`, ...at(realFish.length, caught) },
  { id: 'mao-massa', name: 'Mão na Massa', how: 'Chegar ao nível 3 numa profissão.', ...at(3, bestProf) },
  { id: 'mestre-oficio', name: 'Mestre de Ofício', how: 'Chegar ao nível 5 numa profissão.', ...at(5, bestProf) },
  { id: 'reporter', name: 'Repórter Estrela', how: 'Publicar 5 matérias no jornalzinho.', ...at(5, p => p.materias.length) },
  { id: 'entregador', name: 'Sempre no Prazo', how: 'Fazer 20 entregas.', ...at(20, p => stat(p, 'entregas')) },
  // do WIT 1 (migration.ts): aparecem só para quem tinha
  { id: 'veterano', legacy: true, name: 'Veterano WIT 1', how: 'Jogou o WIT Dungeon 1.', has: p => !!p.legado?.titulos.includes('veterano') },
  { id: 'ajudante-semana', legacy: true, name: 'Ajudante da Semana', how: 'Título do WIT 1.', has: p => !!p.legado?.titulos.includes('ajudante-semana') },
  { id: 'guardiao-presenca', legacy: true, name: 'Guardião da Presença', how: 'Título do WIT 1.', has: p => !!p.legado?.titulos.includes('guardiao-presenca') },
  { id: 'exemplo-atitude', legacy: true, name: 'Exemplo de Atitude', how: 'Título do WIT 1.', has: p => !!p.legado?.titulos.includes('exemplo-atitude') },
  { id: 'sabio-grimorio', name: 'Leitor do Grimório', how: 'Aprender todos os talentos do Grimório.', ...at(GRIMOIRE.length, p => p.grimorio.length) },
];
export const TITLE_BY_ID = new Map(TITLES_LIST.map(t => [t.id, t]));

export const earnedTitles = (p: Progress) => TITLES_LIST.filter(t => t.has(p));
/** Os que aparecem na lista (os do WIT 1 só para quem tem). */
export const visibleTitles = (p: Progress) => TITLES_LIST.filter(t => !t.legacy || t.has(p));

/** O título que aparece na plaquinha: o escolhido (se ganhou), senão o do Caminho ou o da profissão, senão Novato. */
export function shownTitle(p: Progress, profTitle?: string): string {
  const t = p.titulo && TITLE_BY_ID.get(p.titulo);
  if (t && t.has(p)) return t.name;
  if (profTitle) return profTitle;
  if (p.caminho) return PATH_BY_ID.get(p.caminho)!.name.replace(/^O /, '');
  return 'Novato';
}
