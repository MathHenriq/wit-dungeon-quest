// Profissões da Cidade WIT (plano §3.6 e §3.7): o aluno escolhe um cargo no
// Núcleo WIT, ganha experiência fazendo o trabalho (pescar, colher, os
// minijogos de cada prédio) e sobe de nível. Qualquer um pode fazer qualquer
// trabalho; o cargo escolhido dá um bônus no que ele produz. Funções puras.

export type ProfId =
  | 'pescador' | 'fazendeiro' | 'padeiro' | 'musico' | 'artista'
  | 'treinador-ia' | 'tecnico-iot' | 'arquiteto-meta' | 'reporter' | 'dev-games'
  | 'entregador' | 'comerciante';

export type MinigameId = 'forno' | 'ritmo' | 'pintura' | 'rotular' | 'circuito' | 'pares' | 'noticia' | 'teste-jogo';

export interface Profession {
  id: ProfId;
  name: string;
  /** Ícone em public/game/icons/itens. */
  icon: string;
  /** Curso do Núcleo WIT ligado (os 5 cursos), ou nenhum. */
  course?: 'IA' | 'IoT' | 'Metaverso' | 'Comunicação Digital' | 'Oficina de Games';
  /** Onde trabalha (prédio e área). */
  place: string;
  /** Como trabalha: o minijogo, ou a atividade no mapa. */
  minigame?: MinigameId;
  how: string;
  /** O bônus de quem tem esse cargo. */
  perk: string;
}

export const PROFESSIONS: Profession[] = [
  { id: 'pescador', name: 'Pescador', icon: 'peixe', place: 'Lago Azul', how: 'Pesque em qualquer água; venda na Casa de Pesca.', perk: 'Mais peixe raro (+15% por nível) e +10% na venda.' },
  { id: 'fazendeiro', name: 'Fazendeiro', icon: 'colheita:milho', place: 'Fazenda do Vale', how: 'Plante, regue, colha; ovos, leite e lã.', perk: 'Regador maior (+5 por nível) e +10% na caixa de envio.' },
  { id: 'padeiro', name: 'Padeiro', icon: 'pao', place: 'Padaria da Dona Rosa (Centro)', minigame: 'forno', how: 'Tire o pão do forno na hora certa.', perk: 'Uma fornada a mais e bolo com mais facilidade.' },
  { id: 'musico', name: 'Músico', icon: 'disco', place: 'Estúdio de Música (Cidade WIT)', minigame: 'ritmo', how: 'Toque as notas no ritmo e grave um disco.', perk: 'Disco de Ouro com menos acertos.' },
  { id: 'artista', name: 'Artista', icon: 'quadro', place: 'Ateliê de Arte (Cidade WIT)', minigame: 'pintura', how: 'Lembre o desenho e pinte igual.', perk: 'Quadros valem mais (+20%).' },
  { id: 'treinador-ia', name: 'Treinador de IA', icon: 'modelo-ia', course: 'IA', place: 'Laboratório de IA', minigame: 'rotular', how: 'Rotule os dados certinho para treinar um modelo.', perk: 'Modelos treinados com menos exemplos; o WIT-Bot aprende mais.' },
  { id: 'tecnico-iot', name: 'Técnico de IoT', icon: 'sensor', course: 'IoT', place: 'Casa Inteligente', minigame: 'circuito', how: 'Gire as peças e ligue o sensor à central.', perk: 'Um sensor a mais por circuito; o irrigador rega mais canteiros.' },
  { id: 'arquiteto-meta', name: 'Arquiteto do Metaverso', icon: 'cubo-virtual', course: 'Metaverso', place: 'Metaverso', minigame: 'pares', how: 'Ache os pares de objetos 3D e monte a sala virtual.', perk: 'Mais tempo e um cubo a mais.' },
  { id: 'reporter', name: 'Repórter', icon: 'jornal', course: 'Comunicação Digital', place: 'Estúdio de Comunicação', minigame: 'noticia', how: 'Acerte os fatos e publique no Jornal WIT.', perk: 'A matéria paga mais e sai no telão com seu nome.' },
  { id: 'dev-games', name: 'Desenvolvedor de Games', icon: 'tiquete', course: 'Oficina de Games', place: 'Oficina de Games', minigame: 'teste-jogo', how: 'Teste o jogo: pegue os bugs e fuja das bombas.', perk: 'Mais tíquetes por bug pego.' },
  { id: 'entregador', name: 'Entregador', icon: 'pacote', course: 'IoT', place: 'Central de Entregas', how: 'Leve a encomenda até a porta certa, em qualquer área.', perk: 'Mais tempo e mais moedas por entrega.' },
  { id: 'comerciante', name: 'Comerciante', icon: 'moeda', place: 'Mercado Central', how: 'Venda no Mercado quando o preço estiver alto.', perk: '+5% nos preços do Mercado por nível.' },
];
export const PROF_BY_ID = new Map(PROFESSIONS.map(p => [p.id, p]));
export const profOfMinigame = (m: MinigameId) => PROFESSIONS.find(p => p.minigame === m)!;

/** XP para chegar em cada nível (nível 1 começa em 0). */
export const LEVELS = [0, 40, 120, 260, 480, 800];
export const MAX_LEVEL = LEVELS.length;

export function levelOf(xp: number): { level: number; xp: number; next: number | null; into: number; span: number } {
  let level = 1;
  while (level < MAX_LEVEL && xp >= LEVELS[level]) level++;
  const base = LEVELS[level - 1], next = level < MAX_LEVEL ? LEVELS[level] : null;
  return { level, xp, next, into: xp - base, span: next ? next - base : 1 };
}

export const TITLES = ['Aprendiz', 'Ajudante', 'Profissional', 'Especialista', 'Mestre', 'Lenda'];
export function profTitle(id: ProfId, xp: number): string {
  return `${PROF_BY_ID.get(id)!.name} · ${TITLES[levelOf(xp).level - 1]}`;
}

/** Bônus do cargo: 0 se não é o cargo escolhido; senão cresce com o nível (1 → 0,25 ... 6 → 1,5). */
export function perkLevel(chosen: ProfId | undefined, id: ProfId, xp: number): number {
  return chosen === id ? levelOf(xp).level * 0.25 : 0;
}
