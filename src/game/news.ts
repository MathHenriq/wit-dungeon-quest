// Jornal WIT: as manchetes do telão da Cidade WIT, feitas a partir do que
// acontece no jogo (o que os pescadores pegaram hoje, os recordes e o andar da
// Torre do aluno, o dia da fazenda) e dos avisos dos cursos do Núcleo WIT.
import { boardOfDay, FISH_BY_ID } from './fishing';
import type { Progress } from './progress';
import { today } from './life';

const WIT_NEWS = [
  'Lab de IA: os alunos estão treinando o WIT-Bot',
  'Casa IoT: os postes da cidade acendem quando alguém passa',
  'Metaverso: a sala virtual abre em breve',
  'Oficina de Games: fliperamas na rua de baixo',
  'Estúdio: a Rádio WIT vai tocar os discos dos músicos',
  'Central de Entregas: drones levando encomendas',
  'Mercado Central: os preços mudam com a oferta e a procura',
];

/** Deixa só o que a fonte da cidade desenha (maiúsculas sem acento, números, . : ! -). */
export function plain(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 .:!-]/g, '');
}

/** As manchetes do telão (só o que a fonte da cidade desenha). */
export const headlines = (day: number, p: Progress): string[] => newsOfDay(day, p).map(plain);

/** As manchetes com acento e maiúsculas certas (o jornalzinho de papel). */
export function newsOfDay(day: number, p: Progress): string[] {
  const out: string[] = [];
  const board = boardOfDay(day);
  const best = [...board].sort((a, b) => b.fish.price - a.fish.price)[0];
  if (best) out.push(`Lago Azul: ${best.who} pescou ${best.fish.name.toLowerCase()} de ${best.cm} cm`);
  const recs = Object.entries(p.recordes).map(([id, cm]) => ({ f: FISH_BY_ID.get(id), cm })).filter(r => r.f && r.f.price > 0);
  if (recs.length) {
    const top = recs.sort((a, b) => b.f!.price - a.f!.price)[0];
    out.push(`Recorde: você já pescou ${top.f!.name.toLowerCase()} de ${top.cm} cm`);
  }
  if (p.jornal && p.jornal.day === today()) out.unshift(p.jornal.text);
  if (p.towerMax > 1) out.push(`Torre: você já chegou ao andar ${p.towerMax}`);
  out.push('Fazenda do Vale: abóbora vale 28 moedas na caixa de envio');
  // os avisos dos cursos mudam de ordem a cada dia
  const k = day % WIT_NEWS.length;
  out.push(...WIT_NEWS.slice(k), ...WIT_NEWS.slice(0, k));
  return out;
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
