// Jornal WIT: as manchetes do telão da Cidade WIT, feitas a partir do que
// acontece no jogo (o que os pescadores pegaram hoje, os recordes e o andar da
// Torre do aluno, o dia da fazenda) e dos avisos dos cursos do Núcleo WIT.
import { boardOfDay, FISH_BY_ID } from './fishing';
import type { Progress } from './progress';

const WIT_NEWS = [
  'LAB DE IA: OS ALUNOS ESTAO TREINANDO O WIT-BOT',
  'CASA IOT: OS POSTES DA CIDADE ACENDEM QUANDO ALGUEM PASSA',
  'METAVERSO: A SALA VIRTUAL ABRE EM BREVE',
  'OFICINA DE GAMES: FLIPERAMAS NA RUA DE BAIXO',
  'ESTUDIO: A RADIO WIT VAI TOCAR OS DISCOS DOS MUSICOS',
  'CENTRAL DE ENTREGAS: DRONES LEVANDO ENCOMENDAS',
  'MERCADO: EM BREVE OS PRECOS MUDAM COM A OFERTA E A PROCURA',
];

/** Deixa só o que a fonte da cidade desenha (maiúsculas sem acento, números, . : ! -). */
export function plain(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 .:!-]/g, '');
}

export function headlines(day: number, p: Progress): string[] {
  const out: string[] = [];
  const board = boardOfDay(day);
  const best = [...board].sort((a, b) => b.fish.price - a.fish.price)[0];
  if (best) out.push(`LAGO AZUL: ${best.who} PESCOU ${best.fish.name} DE ${best.cm} CM`);
  const recs = Object.entries(p.recordes).map(([id, cm]) => ({ f: FISH_BY_ID.get(id), cm })).filter(r => r.f && r.f.price > 0);
  if (recs.length) {
    const top = recs.sort((a, b) => b.f!.price - a.f!.price)[0];
    out.push(`RECORDE: VOCE JA PESCOU ${top.f!.name} DE ${top.cm} CM`);
  }
  if (p.towerMax > 1) out.push(`TORRE: VOCE JA CHEGOU AO ANDAR ${p.towerMax}`);
  out.push('FAZENDA DO VALE: ABOBORA VALE 28 MOEDAS NA CAIXA DE ENVIO');
  // os avisos dos cursos mudam de ordem a cada dia
  const k = day % WIT_NEWS.length;
  out.push(...WIT_NEWS.slice(k), ...WIT_NEWS.slice(0, k));
  return out.map(plain);
}

/** Dicas do WIT-Bot (o robô da praça, "treinado" pelo Lab de IA). */
export const BOT_TIPS = [
  'Bip! Eu sou o WIT-Bot. Aprendi a conversar com os exemplos que os alunos do Lab de IA me deram.',
  'Uma IA aprende com dados. Se os exemplos forem ruins, ela aprende errado! Bip.',
  'IoT é quando as coisas conversam pela internet: os postes daqui têm sensor e acendem quando você chega perto.',
  'No Metaverso dá para encontrar os amigos numa sala virtual. Em breve, aqui do lado!',
  'Os drones da Central de Entregas voam sozinhos: seguem um mapa e desviam dos prédios.',
  'Na Oficina de Games vocês vão criar fases. Eu quero ser o chefe de alguma! Bip bip.',
  'No Estúdio de Comunicação sai o Jornal WIT: aquele que passa no telão.',
];
