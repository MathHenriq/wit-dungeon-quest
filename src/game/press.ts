// Comunicação Digital: a matéria (o lide: QUEM, O QUÊ, ONDE, QUANDO), tirado
// da fala de uma testemunha sobre coisas que acontecem no jogo, e o
// jornalzinho do dia (1 moeda no Estúdio) com as matérias e fotos do aluno.
import { boardOfDay } from './fishing';
import { BOT_TIPS, newsOfDay } from './news';
import type { Progress } from './progress';
import { rng } from './minigames';

export const LIDE = ['quem', 'oque', 'onde', 'quando'] as const;
export type LideSlot = (typeof LIDE)[number];
export const LIDE_NAME: Record<LideSlot, string> = { quem: 'QUEM?', oque: 'O QUÊ?', onde: 'ONDE?', quando: 'QUANDO?' };

/** Um fato que dá matéria: as quatro partes do lide e a fala de quem viu. */
export interface PressEvent { id: string; quem: string; oque: string; onde: string; quando: string; testemunha: string; fala: string }

/** Os fatos de hoje: parte vem do jogo (quadro da pesca, andar da Torre), parte da vida da cidade. */
export function pressEvents(day: number, towerMax: number): PressEvent[] {
  const out: PressEvent[] = [];
  const board = boardOfDay(day);
  const top = [...board].sort((a, b) => b.cm - a.cm)[0];
  if (top) out.push({
    id: 'pesca', quem: top.who, oque: `pescou um ${top.fish.name.toLowerCase()} de ${top.cm} cm`, onde: 'no Lago Azul', quando: 'hoje de manhã',
    testemunha: 'Seu Tião, da Casa de Pesca',
    fala: `Eu estava no píer do Lago Azul hoje de manhã e vi: ${top.who} puxou um ${top.fish.name.toLowerCase()} de ${top.cm} cm! Que peixão!`,
  });
  out.push({
    id: 'torre', quem: 'um aluno do Núcleo WIT', oque: `chegou ao andar ${towerMax} da Torre`, onde: 'na Torre do Centro', quando: 'nesta semana',
    testemunha: 'a recepcionista da Torre',
    fala: `Nesta semana um aluno do Núcleo WIT venceu os desafiantes e chegou ao andar ${towerMax}. Aqui na Torre do Centro todo mundo comentou!`,
  });
  out.push(
    { id: 'robo', quem: 'os alunos do Lab de IA', oque: 'ensinaram um robô a catar lixo', onde: 'na Cidade WIT', quando: 'ontem',
      testemunha: 'o WIT-Bot', fala: 'Bip! Ontem os alunos do Lab de IA terminaram de treinar meu primo robô. Agora ele cata o lixo da Cidade WIT sozinho!' },
    { id: 'postes', quem: 'a turma de IoT', oque: 'ligou sensores nos postes', onde: 'na praça da Cidade WIT', quando: 'segunda-feira',
      testemunha: 'um morador', fala: 'Na segunda-feira a turma de IoT subiu nos postes da praça da Cidade WIT e colocou sensores. Agora eles acendem quando a gente passa.' },
    { id: 'show', quem: 'o músico Léo', oque: 'fez um show com músicas dos alunos', onde: 'na praça do Centro', quando: 'sábado à noite',
      testemunha: 'a dona da padaria', fala: 'Sábado à noite fechei a padaria mais cedo para ver o Léo tocar na praça do Centro. Ele só tocou músicas feitas pelos alunos!' },
    { id: 'pao', quem: 'a padeira Dona Rosa', oque: 'assou 200 pães de forma', onde: 'na Padaria do Centro', quando: 'hoje de madrugada',
      testemunha: 'o entregador', fala: 'Cheguei na Padaria do Centro hoje de madrugada e a Dona Rosa já tinha assado 200 pães de forma. O cheiro ia longe!' },
    { id: 'abobora', quem: 'o fazendeiro Juca', oque: 'colheu uma abóbora gigante', onde: 'na Fazenda do Vale', quando: 'domingo',
      testemunha: 'a vizinha da fazenda', fala: 'No domingo o Juca precisou de um carrinho de mão: colheu uma abóbora gigante lá na Fazenda do Vale!' },
    { id: 'drone', quem: 'um drone de entregas', oque: 'levou remédio até a fazenda', onde: 'na Central de Entregas', quando: 'hoje à tarde',
      testemunha: 'a moça da Central de Entregas', fala: 'Hoje à tarde saiu daqui da Central de Entregas um drone com remédio para a fazenda. Chegou em 3 minutos!' },
  );
  return out;
}

/** Uma pauta: o fato certo e as opções de cada parte (a certa + 2 de outros fatos). */
export interface Pauta { event: PressEvent; options: Record<LideSlot, string[]> }

/** As pautas do trabalho (3 por vez): fatos diferentes, opções embaralhadas pela semente. */
export function pautas(day: number, seed: number, towerMax: number, n = 3): Pauta[] {
  const r = rng(seed);
  const all = pressEvents(day, towerMax);
  const pool = [...all].sort(() => r() - 0.5);
  return pool.slice(0, n).map(event => {
    const others = all.filter(e => e.id !== event.id).sort(() => r() - 0.5);
    const options = {} as Record<LideSlot, string[]>;
    for (const s of LIDE) {
      const wrong = [...new Set(others.map(o => o[s]).filter(v => v !== event[s]))].slice(0, 2);
      options[s] = [event[s], ...wrong].sort(() => r() - 0.5);
    }
    return { event, options };
  });
}

export type Lide = Partial<Record<LideSlot, string>>;

/** Quantas partes batem com o fato (0 a 4). */
export const lideHits = (p: Pauta, l: Lide) => LIDE.filter(s => l[s] === p.event[s]).length;

/** A frase da matéria: "Quem o quê onde, quando." (com a primeira letra maiúscula). */
export function lideText(l: Lide): string {
  const t = [l.quem, l.oque, l.onde].filter(Boolean).join(' ') + (l.quando ? `, ${l.quando}` : '');
  return t ? t[0].toUpperCase() + t.slice(1) + '.' : '';
}

// ─── jornalzinho ────────────────────────────────────────────────────────────

export const PAPER_PRICE = 1;

export interface Edition { numero: number; manchete: string; materias: { text: string; foto?: string; minha: boolean }[]; notas: string[]; dica: string }

/** A edição do dia: matérias do aluno primeiro (com foto), depois as manchetes do jogo. */
/** Nº 1 = 01/10/2026, o dia em que o jornalzinho começou. */
export function edition(day: number, p: Progress, startDay = 20_361): Edition {
  const sentences = newsOfDay(day, p);
  const mine = p.materias.filter(m => m.day >= day - 6).map(m => ({ text: m.text, foto: m.foto, minha: true }));
  return {
    numero: Math.max(1, day - startDay),
    manchete: mine[0]?.text ?? sentences[0] ?? 'Dia tranquilo na Cidade WIT',
    materias: mine.slice(0, 4),
    notas: sentences.filter(n => n !== p.jornal?.text).slice(mine.length ? 0 : 1, 6),
    dica: BOT_TIPS[day % BOT_TIPS.length],
  };
}

export function buyPaper(p: Progress, day: number): { progress: Progress } | { reason: string } {
  if (p.jornalDia === day) return { progress: p };
  if (p.coins < PAPER_PRICE) return { reason: 'Falta 1 moeda para o jornalzinho.' };
  return { progress: { ...p, coins: p.coins - PAPER_PRICE, jornalDia: day } };
}

/** Guarda a matéria publicada (as 12 mais novas). */
export function publish(p: Progress, day: number, text: string, foto?: string): Progress {
  return { ...p, materias: [{ day, text: text.slice(0, 140), foto }, ...p.materias].slice(0, 12) };
}
