// Os professores do Núcleo WIT dentro do jogo (docs/professores-no-jogo.md).
// Cada um tem curso, casa, passatempo e uma rotina por hora:
//   0h–8h casa · 8h–12h aula (na porta do prédio do curso, na Cidade WIT)
//   12h–14h almoço (no carrinho de cachorro-quente do Maycon, na praça do Centro)
//   14h–19h passatempo · 19h–24h casa
// Cada parte do dia é um "morador" separado (id `prof:<id>:<parte>`), que só
// aparece na hora dele; assim o professor "anda" entre as áreas do mundo.
//
// O visual é provisório (os modelos recoloridos) até chegar o boneco feito a
// partir da foto de cada um (prompt em docs/professores-no-jogo.md).
// Professor saiu do WIT? `ativo: false` tira ele do jogo inteiro.
import type { Dir } from './movement';
import type { NpcDef } from './content';
import type { ZoneId } from './zone';
import type { Look } from './outfit';
import type { NpcJob } from './jobs';

export type Curso = 'ia' | 'games' | 'comunicacao' | 'iot' | 'metaverso';

/** Prédio de cada curso na Cidade WIT (o painel de tarefas é o da porta: `WORK_DOORS`). */
export const CURSO: Record<Curso, { nome: string; predio: string }> = {
  ia: { nome: 'Inteligência Artificial', predio: 'lab-ia' },
  games: { nome: 'Oficina de Games', predio: 'oficina-games' },
  comunicacao: { nome: 'Comunicação Digital', predio: 'estudio' },
  iot: { nome: 'IoT', predio: 'casa-iot' },
  metaverso: { nome: 'Metaverso', predio: 'metaverso' },
};

type Spot = { zona: ZoneId; tx: number; ty: number; dir: Dir; job?: NpcJob };

export interface Professor {
  id: string;
  /** Como aparece na plaquinha. */
  nome: string;
  curso: Curso;
  /** Prédio onde mora (porta da cidade). */
  casa: string;
  ativo: boolean;
  look: Look;
  /** Onde fica na aula (perto da porta do curso, sem tapar a porta). */
  aula: Spot;
  almoco: Spot;
  /** O passatempo à tarde: fora (no mapa), em casa, ou na casa de outro (`emCasaDe`, porta). Vai até `ate` (padrão 19h). */
  passatempo: { texto: string; onde: Spot | 'casa'; emCasaDe?: string; ate?: number };
  /** O que diz em cada parte do dia. */
  falas: { aula: string[]; almoco: string[]; passatempo: string[]; casa: string[] };
  /** Ação especial no passatempo (vender, tirar foto). */
  acao?: 'cachorro-quente' | 'foto';
}

const L = (modelo: string, pele: string, cabelo: string, cima: string, baixo: string, acc?: Look['acc']): Look => ({ modelo, pele, cabelo, cima, baixo, acc });

// rota de moto (provisória, a pé até chegar o boneco na moto): as ruas do Centro
const ROTA_MOTO: NpcJob = { kind: 'passear', route: [[22, 21, 'east'], [44, 21, 'south'], [31, 33, 'west'], [12, 33, 'north']], pause: [800, 1600] };
const ROTA_FOTO: NpcJob = { kind: 'passear', route: [[24, 29, 'south'], [34, 39, 'east'], [50, 40, 'north'], [23, 25, 'west']], pause: [3000, 6000] };

export const PROFESSORES: Professor[] = [
  {
    id: 'dante', nome: 'Prof. Dante', curso: 'ia', casa: 'casa-laranja', ativo: true,
    look: L('modelo-08', 'pele-3', 'preto', 'preto', 'jeans'),
    aula: { zona: 'wit', tx: 14, ty: 13, dir: 'south' }, almoco: { zona: 'cidade', tx: 34, ty: 21, dir: 'east' },
    passatempo: { texto: 'anda de moto com o Prof. Wellington', onde: { zona: 'cidade', tx: 22, ty: 21, dir: 'east', job: ROTA_MOTO } },
    falas: {
      aula: ['Prof. Dante: Bora treinar uma IA hoje? Escolhe a tarefa.'],
      almoco: ['Prof. Dante: Cachorro-quente do Maycon é o melhor do Vale. Fato.'],
      passatempo: ['Prof. Dante: Casaco preto, capacete e estrada. A tarde é da moto!', 'Prof. Dante: O Wellington vem logo atrás. Ou na frente, quando ele acelera.'],
      casa: ['Prof. Dante: Oi! Acabei de guardar a moto. Amanhã tem aula, hein.'],
    },
  },
  {
    id: 'wellington', nome: 'Prof. Wellington', curso: 'iot', casa: 'casa-roxa', ativo: true,
    look: L('modelo-09', 'pele-5', 'preto', 'marinho', 'preto'),
    aula: { zona: 'wit', tx: 3, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 35, ty: 22, dir: 'north' },
    passatempo: { texto: 'anda de moto com o Prof. Dante', onde: { zona: 'cidade', tx: 44, ty: 21, dir: 'south', job: ROTA_MOTO } },
    falas: {
      aula: ['Prof. Wellington: Sensor ligado, regra montada. Vamos de IoT?'],
      almoco: ['Prof. Wellington: Hoje à tarde tem passeio de moto. Se o Dante não atrasar.'],
      passatempo: ['Prof. Wellington: Moto é igual circuito: tudo tem que estar bem ligado.', 'Prof. Wellington: Cadê o Dante? Ficou para trás de novo!'],
      casa: ['Prof. Wellington: Moto na garagem, pé pra cima. Até amanhã!'],
    },
  },
  {
    id: 'mayara', nome: 'Profa. Mayara', curso: 'ia', casa: 'moradia-3', ativo: true,
    look: L('modelo-03', 'pele-4', 'preto', 'branco', 'preto'),
    aula: { zona: 'wit', tx: 15, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 38, ty: 21, dir: 'west' },
    passatempo: { texto: 'treina jiu-jitsu em casa', onde: 'casa' },
    falas: {
      aula: ['Profa. Mayara: Oi! Pronto para ensinar o computador a pensar?'],
      almoco: ['Profa. Mayara: Depois do almoço é treino. Jiu-jitsu não espera!'],
      passatempo: ['Profa. Mayara: Oss! Treinando no tatame da sala.', 'Profa. Mayara: Jiu-jitsu é estratégia, igual carta: quem pensa antes, vence.'],
      casa: ['Profa. Mayara: Oss! Treino feito. Agora é descanso.'],
    },
  },
  {
    id: 'macedo', nome: 'Prof. Matheus Macedo', curso: 'ia', casa: 'casa-verde', ativo: true,
    look: L('modelo-02', 'pele-3', 'castanho', 'verde', 'jeans', { rosto: { id: 'oculos', cor: 'preto' } }),
    aula: { zona: 'wit', tx: 11, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 39, ty: 21, dir: 'west' },
    passatempo: { texto: 'joga no PC gamer; no fim da tarde, churrasco', onde: 'casa' },
    falas: {
      aula: ['Prof. Matheus Macedo: Bem-vindo ao Lab de IA! Escolhe o desafio de hoje.'],
      almoco: ['Prof. Matheus Macedo: Fiz este jogo para vocês. Achou algum bug? Me conta!'],
      passatempo: ['Prof. Matheus Macedo: Uma partida no PC gamer e já vou acender a churrasqueira.', 'Prof. Matheus Macedo: O cheiro do churrasco chega até a praça, né?'],
      casa: ['Prof. Matheus Macedo: Churrasco pronto! Pena que é só no jogo...'],
    },
  },
  {
    id: 'guilherme', nome: 'Prof. Guilherme Rodrigues', curso: 'iot', casa: 'moradia-4', ativo: true,
    look: L('modelo-09', 'pele-2', 'castanho', 'vermelho', 'preto'),
    aula: { zona: 'wit', tx: 7, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 40, ty: 21, dir: 'west' },
    passatempo: { texto: 'treina muay thai em casa', onde: 'casa' },
    falas: {
      aula: ['Prof. Guilherme: Bora montar um circuito? Cada fio no lugar certo.'],
      almoco: ['Prof. Guilherme: Almoço leve, que à tarde tem muay thai.'],
      passatempo: ['Prof. Guilherme: Jab, chute, joelhada! O saco de pancada que se cuide.', 'Prof. Guilherme: Muay thai ensina disciplina. Igual programar.'],
      casa: ['Prof. Guilherme: Treino pago. Agora é gelo no joelho e cama.'],
    },
  },
  {
    id: 'servilha', nome: 'Prof. Matheus Servilha', curso: 'games', casa: 'casa-vermelha', ativo: true,
    look: L('modelo-07', 'pele-3', 'preto', 'roxo', 'jeans', { cabeca: { id: 'fone', cor: 'preto' } }),
    aula: { zona: 'wit', tx: 5, ty: 35, dir: 'north' }, almoco: { zona: 'cidade', tx: 41, ty: 21, dir: 'west' },
    passatempo: { texto: 'joga games em casa com o Vitor e o Miguel', onde: 'casa', ate: 22 },
    falas: {
      aula: ['Prof. Matheus Servilha: Oficina de Games aberta! Bora criar e testar jogo.'],
      almoco: ['Prof. Matheus Servilha: Hoje tem jogatina lá em casa. O Vitor e o Miguel já confirmaram.'],
      passatempo: ['Prof. Matheus Servilha: Shhh, último round! O Miguel tá quase ganhando...', 'Prof. Matheus Servilha: Vitor, passa o controle!'],
      casa: ['Prof. Matheus Servilha: Os meninos foram embora. Hora de salvar o jogo e dormir.'],
    },
  },
  {
    id: 'vitor', nome: 'Prof. Vitor', curso: 'games', casa: 'moradia-1', ativo: true,
    look: L('modelo-01', 'pele-2', 'loiro', 'azul', 'preto'),
    aula: { zona: 'wit', tx: 9, ty: 35, dir: 'north' }, almoco: { zona: 'cidade', tx: 42, ty: 21, dir: 'west' },
    passatempo: { texto: 'joga games na casa do Prof. Servilha', onde: 'casa', emCasaDe: 'casa-vermelha', ate: 22 },
    falas: {
      aula: ['Prof. Vitor: Achou um bug? Anota! Testar jogo é trabalho sério.'],
      almoco: ['Prof. Vitor: Mais tarde tem jogatina na casa do Servilha.'],
      passatempo: ['Prof. Vitor: (na casa do Servilha) Não conta para ninguém, mas eu tô perdendo.'],
      casa: ['Prof. Vitor: Voltei da casa do Servilha. Eu ganhei. Talvez.'],
    },
  },
  {
    id: 'miguel', nome: 'Prof. Miguel', curso: 'games', casa: 'moradia-1', ativo: true,
    look: L('modelo-05', 'pele-4', 'castanho', 'laranja', 'jeans'),
    aula: { zona: 'wit', tx: 8, ty: 36, dir: 'north' }, almoco: { zona: 'cidade', tx: 34, ty: 22, dir: 'east' },
    passatempo: { texto: 'joga games na casa do Prof. Servilha', onde: 'casa', emCasaDe: 'casa-vermelha', ate: 22 },
    falas: {
      aula: ['Prof. Miguel: Lógica de jogo é igual receita: um passo depois do outro.'],
      almoco: ['Prof. Miguel: Hoje eu ganho do Vitor e do Servilha. Pode anotar.'],
      passatempo: ['Prof. Miguel: (na casa do Servilha) GG! Mais uma?'],
      casa: ['Prof. Miguel: Divido a casa com o Vitor. Ele ronca. Não conta para ele.'],
    },
  },
  {
    id: 'leticia', nome: 'Profa. Leticia', curso: 'comunicacao', casa: 'casa-azul', ativo: true,
    look: L('modelo-08', 'pele-1', 'castanho', 'rosa', 'branco'),
    aula: { zona: 'wit', tx: 44, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 36, ty: 22, dir: 'north' },
    passatempo: { texto: 'lê livros na praia do Lago', onde: { zona: 'lago', tx: 21, ty: 25, dir: 'south' } },
    falas: {
      aula: ['Profa. Leticia: Toda boa notícia começa com uma boa pergunta. Vamos escrever?'],
      almoco: ['Profa. Leticia: Terminei um livro ontem. O final... não vou contar!'],
      passatempo: ['Profa. Leticia: Shhh... tô no melhor capítulo.', 'Profa. Leticia: Lê muito, viu? Quem lê escreve melhor.'],
      casa: ['Profa. Leticia: Só mais um capítulo antes de dormir. Ou dois.'],
    },
  },
  {
    id: 'felipe', nome: 'Prof. Felipe Oliveira', curso: 'comunicacao', casa: 'npc-musico', ativo: true,
    look: L('modelo-02', 'pele-5', 'preto', 'preto', 'jeans', { cabeca: { id: 'fone', cor: 'vermelho' } }),
    aula: { zona: 'wit', tx: 43, ty: 13, dir: 'south' }, almoco: { zona: 'cidade', tx: 38, ty: 20, dir: 'south' },
    passatempo: { texto: 'toca guitarra na praça', onde: { zona: 'cidade', tx: 27, ty: 21, dir: 'south', job: { kind: 'musica' } } },
    falas: {
      aula: ['Prof. Felipe Oliveira: Rádio, podcast, vídeo: hoje a gente comunica!'],
      almoco: ['Prof. Felipe Oliveira: Depois do almoço tem show na praça. Traz os amigos!'],
      passatempo: ['Prof. Felipe Oliveira: (solo de guitarra) Essa eu compus ontem!', 'Prof. Felipe Oliveira: Você compõe também? O Estúdio de Música é logo ali.'],
      casa: ['Prof. Felipe Oliveira: Tocando baixinho para não acordar os vizinhos.'],
    },
  },
  {
    id: 'maycon', nome: 'Prof. Maycon', curso: 'metaverso', casa: 'moradia-2', ativo: true,
    look: L('modelo-04', 'pele-4', 'preto', 'vermelho', 'jeans', { cabeca: { id: 'bandana', cor: 'vermelho' } }),
    aula: { zona: 'wit', tx: 48, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 37, ty: 21, dir: 'south' },
    passatempo: { texto: 'vende cachorro-quente na praça', onde: { zona: 'cidade', tx: 37, ty: 21, dir: 'south' } },
    acao: 'cachorro-quente',
    falas: {
      aula: ['Prof. Maycon: Bem-vindo ao Metaverso! Coordenada certa, mundo certo.'],
      almoco: ['Prof. Maycon: Olha o cachorro-quente! Quentinho, com batata palha!'],
      passatempo: ['Prof. Maycon: Olha o cachorro-quente!'],
      casa: ['Prof. Maycon: Carrinho guardado. Amanhã tem mais!'],
    },
  },
  {
    id: 'grazyelle', nome: 'Profa. Grazyelle', curso: 'comunicacao', casa: 'npc-artista', ativo: true,
    look: L('modelo-10', 'pele-3', 'ruivo', 'amarelo', 'jeans', { corpo: { id: 'bolsa', cor: 'preto' } }),
    aula: { zona: 'wit', tx: 40, ty: 12, dir: 'south' }, almoco: { zona: 'cidade', tx: 36, ty: 21, dir: 'south' },
    passatempo: { texto: 'tira fotos pelo Lago Azul', onde: { zona: 'lago', tx: 24, ty: 29, dir: 'south', job: ROTA_FOTO } },
    acao: 'foto',
    falas: {
      aula: ['Profa. Grazyelle: Enquadra, foca e clica! Bora para o Estúdio.'],
      almoco: ['Profa. Grazyelle: A luz do meio-dia é dura para foto. Melhor no fim da tarde.'],
      passatempo: ['Profa. Grazyelle: Sorria! *clique* Ficou ótima, vai para o seu álbum.'],
      casa: ['Profa. Grazyelle: Editando as fotos do dia. Saiu uma sua, sabia?'],
    },
  },
];

export const PROF_BY_ID = new Map(PROFESSORES.map(p => [p.id, p]));
const ativos = () => PROFESSORES.filter(p => p.ativo);

export type Parte = 'aula' | 'almoco' | 'passatempo' | 'casa';

/** Em que parte do dia o professor está. */
export function parteDoDia(p: Professor, hour: number): Parte {
  if (hour >= 8 && hour < 12) return 'aula';
  if (hour >= 12 && hour < 14) return 'almoco';
  if (hour >= 14 && hour < (p.passatempo.ate ?? 19)) return 'passatempo';
  return 'casa';
}

/** Onde ele está agora: num lugar do mapa, ou dentro de casa. */
export function ondeEsta(p: Professor, hour: number): { parte: Parte; spot: Spot | null } {
  const parte = parteDoDia(p, hour);
  if (parte === 'aula') return { parte, spot: p.aula };
  if (parte === 'almoco') return { parte, spot: p.almoco };
  if (parte === 'passatempo') return { parte, spot: p.passatempo.onde === 'casa' ? null : p.passatempo.onde };
  return { parte, spot: null };
}

const NPC_ID = (p: Professor, parte: Parte) => `prof:${p.id}:${parte}`;
export const profOf = (npcId: string): { prof: Professor; parte: Parte } | null => {
  const m = /^prof:([a-z]+):([a-z]+)$/.exec(npcId);
  const prof = m ? PROF_BY_ID.get(m[1]) : undefined;
  return prof && m ? { prof, parte: m[2] as Parte } : null;
};

/** Um morador por parte do dia em que o professor está no mapa (aula, almoço, passatempo fora). */
export function profNpcs(): NpcDef[] {
  const out: NpcDef[] = [];
  for (const p of ativos()) {
    const title = CURSO[p.curso].nome;
    const parts: [Parte, Spot | null][] = [['aula', p.aula], ['almoco', p.almoco], ['passatempo', p.passatempo.onde === 'casa' ? null : p.passatempo.onde]];
    for (const [parte, s] of parts) {
      if (!s) continue;
      out.push({ id: NPC_ID(p, parte), zona: s.zona, tx: s.tx, ty: s.ty, dir: s.dir, look: p.look, name: p.nome, title, lines: p.falas[parte], job: s.job });
    }
  }
  return out;
}

/** O morador-professor aparece agora? (Os outros moradores: sempre.) */
export function profVisible(npcId: string, hour: number): boolean {
  const k = profOf(npcId);
  if (!k) return true;
  return parteDoDia(k.prof, hour) === k.parte;
}

/** Quem mora nesta casa (porta da cidade). */
export const moradores = (predio: string) => ativos().filter(p => p.casa === predio);

/** Quem está dentro desta casa agora (moradores em casa e visitas do passatempo). */
export function emCasa(predio: string, hour: number): Professor[] {
  return ativos().filter(p => {
    const parte = parteDoDia(p, hour);
    if (parte === 'passatempo' && p.passatempo.emCasaDe) return p.passatempo.emCasaDe === predio;
    if (p.casa !== predio) return false;
    return parte === 'casa' || (parte === 'passatempo' && p.passatempo.onde === 'casa');
  });
}

/** Bater na porta de uma casa de professor: quem atende e o que diz (ou onde o dono está). null = não é casa de professor. */
export function bateNaPorta(predio: string, hour: number): string[] | null {
  const donos = moradores(predio);
  if (!donos.length) return null;
  const art = donos.length > 1 ? 'dos' : donos[0].nome.startsWith('Profa') ? 'da' : 'do';
  const lines = [`Casa ${art} ${donos.map(q => q.nome).join(' e ')}. Você bate na porta...`];
  const dentro = emCasa(predio, hour);
  for (const p of dentro) lines.push(...(parteDoDia(p, hour) === 'passatempo' ? p.falas.passatempo : p.falas.casa));
  if (!dentro.length) {
    const p = donos[0], parte = parteDoDia(p, hour);
    const onde = parte === 'aula' ? `dando aula de ${CURSO[p.curso].nome} na Cidade WIT` : parte === 'almoco' ? 'almoçando na praça do Centro' : p.passatempo.texto;
    lines.push(`Ninguém atende. ${donos.length > 1 ? 'Eles devem estar' : `${p.nome} deve estar`} ${onde}.`);
  }
  return lines;
}
