// Trabalho de campo: a tarefa de cada profissão que faz ANDAR pelo mapa.
// O aluno pega o trabalho no local de trabalho; aparecem alvos marcados em
// várias áreas (Centro, Lago, Fazenda, Cidade WIT). Chegar no alvo (ou falar
// com o morador, na entrevista) cumpre aquele ponto; cumpriu todos, recebe.
// Os alvos saem da semente: a posição de cada um é calculada quando a área
// dele está montada (a porta de um prédio, um canto livre da rua...).
import type { ProfId } from './professions';
import type { Progress } from './progress';
import { addItem } from './progress';
import { gainXp, PAID_PER_DAY, playsLeft, spendPlay, today } from './life';
import { NPCS } from './world/content';
import type { Town, ZoneId } from './world/zone';

export type FieldKind = 'porta' | 'chao' | 'falar' | 'poste';
export interface FieldJob {
  id: string; prof: ProfId; name: string; how: string;
  /** porta = na frente de um prédio; chao = um lugar livre qualquer; falar = um morador; poste = embaixo de um poste. */
  kind: FieldKind;
  /** A área de cada alvo (a ordem não importa para o aluno). */
  zones: ZoneId[];
  /** O que aparece ao cumprir cada ponto. */
  line: string;
  coins: number; xp: number;
  /** Item gasto em cada ponto (o pão da cesta, o leite da rota). */
  need?: string;
  /** Prazo em minutos de verdade. */
  minutes?: number;
  /** Só aparece quando chega perto (os bugs têm de ser procurados). */
  hidden?: boolean;
  color: string;
}

export const FIELD_JOBS: FieldJob[] = [
  { id: 'sensores', prof: 'tecnico-iot', name: 'Instalar sensores', how: 'Leve 4 sensores até os pontos marcados e instale na frente de cada prédio.', kind: 'porta', zones: ['cidade', 'wit', 'wit', 'fazenda'],
    line: 'Sensor instalado! Agora este lugar manda dados para a Casa Inteligente.', coins: 45, xp: 30, color: '#2a9a5a' },
  { id: 'escanear', prof: 'arquiteto-meta', name: 'Escanear a cidade', how: 'Escaneie 4 prédios em áreas diferentes para a biblioteca 3D do Metaverso.', kind: 'porta', zones: ['cidade', 'lago', 'wit', 'fazenda'],
    line: 'Escaneado! O prédio virou um modelo 3D na biblioteca do Metaverso.', coins: 50, xp: 30, color: '#7a4ac8' },
  { id: 'bugs', prof: 'dev-games', name: 'Caça-bugs no mapa', how: 'Há 5 bugs escondidos no mundo (um bloco piscando estranho). Eles só aparecem de perto: procure!', kind: 'chao', zones: ['cidade', 'cidade', 'lago', 'wit', 'fazenda'],
    line: 'Bug consertado! Era um bloco fora do lugar.', coins: 55, xp: 35, hidden: true, color: '#e83aa8' },
  { id: 'dados', prof: 'treinador-ia', name: 'Caça aos dados', how: 'Tire 4 fotos de exemplos (bichos, plantas, ruas) nos pontos marcados para o conjunto de dados da IA.', kind: 'chao', zones: ['lago', 'fazenda', 'cidade', 'wit'],
    line: 'Foto para o conjunto de dados: mais um exemplo para a IA aprender.', coins: 45, xp: 30, color: '#2a9ac8' },
  { id: 'cesta', prof: 'padeiro', name: 'Cesta da manhã', how: 'Leve 4 pães para as casas marcadas do Centro em 5 minutos (precisa de 4 pães na mochila).', kind: 'porta', zones: ['cidade', 'cidade', 'cidade', 'cidade'],
    line: 'Pão quentinho entregue. Bom dia!', coins: 40, xp: 30, need: 'pao', minutes: 5, color: '#c87a2a' },
  { id: 'leite', prof: 'fazendeiro', name: 'Rota do leite', how: 'Leve leite fresco para 4 casas marcadas na Fazenda, no Centro e no Lago (precisa de 4 leites).', kind: 'porta', zones: ['fazenda', 'cidade', 'cidade', 'lago'],
    line: 'Leite fresquinho entregue!', coins: 50, xp: 30, need: 'leite', color: '#5a9a3a' },
  { id: 'entrevista', prof: 'reporter', name: 'Entrevista', how: 'Entreviste 3 moradores marcados, em áreas diferentes. As respostas viram uma matéria no jornalzinho.', kind: 'falar', zones: ['cidade', 'lago', 'fazenda'],
    line: 'Entrevista anotada no bloquinho!', coins: 40, xp: 30, color: '#c84a6a' },
  { id: 'postes', prof: 'tecnico-iot', name: 'Conserto dos postes', how: 'Quatro postes inteligentes queimaram. Vá até eles (marcados no Centro e na Cidade WIT) e troque o sensor em 6 minutos.', kind: 'poste', zones: ['cidade', 'cidade', 'wit', 'wit'],
    line: 'Poste consertado! O sensor voltou a mandar dados.', coins: 45, xp: 30, minutes: 6, color: '#e8a020' },
  { id: 'pesquisa', prof: 'comerciante', name: 'Pesquisa de mercado', how: 'Pergunte a 4 moradores, em áreas diferentes, o que eles querem comprar. A resposta vira uma tabela no Mercado.', kind: 'falar', zones: ['cidade', 'lago', 'fazenda', 'wit'],
    line: 'Resposta anotada na prancheta!', coins: 45, xp: 30, color: '#3a78c8' },
];
export const FIELD_BY_ID = new Map(FIELD_JOBS.map(j => [j.id, j]));
export const fieldOf = (prof: ProfId) => FIELD_JOBS.find(j => j.prof === prof);
/** Todos os trabalhos de campo da profissão (alguns têm dois). */
export const fieldsOf = (prof: ProfId) => FIELD_JOBS.filter(j => j.prof === prof);

export interface Campo { job: string; seed: number; feitos: number[]; ini: number }

/** Número entre 0 e 1 que só depende da semente e do índice. */
const h01 = (seed: number, k: number) => { const x = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

/** Blocos livres que dá para alcançar andando a partir do começo da área. */
export function reachable(t: Town): Set<string> {
  const H = t.solid.length, W = t.solid[0].length;
  const seen = new Set([`${t.spawn.tx},${t.spawn.ty}`]);
  const q: [number, number][] = [[t.spawn.tx, t.spawn.ty]];
  while (q.length) {
    const [x, y] = q.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || t.solid[ny][nx]) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

export interface FieldTarget { i: number; tx: number; ty: number; label: string; npc?: string }

/**
 * Onde ficam, nesta área, os alvos do trabalho que ainda faltam (e os
 * feitos, para o mapa). Porta: o bloco de frente para um prédio. Chão: um
 * bloco livre alcançável longe das portas. Falar: o morador (anda; a posição
 * é a de casa, a tela usa a dele de verdade).
 */
export function targetsIn(t: Town, c: Campo): FieldTarget[] {
  const job = FIELD_BY_ID.get(c.job);
  if (!job) return [];
  const idx = job.zones.map((z, i) => (z === t.id ? i : -1)).filter(i => i >= 0);
  if (!idx.length) return [];
  if (job.kind === 'falar') {
    return idx.map((i, n) => {
      const pool = NPCS.filter(p => (p.zona ?? 'cidade') === t.id);
      const npc = pool[Math.floor(h01(c.seed, i + n * 7) * pool.length)];
      return { i, tx: npc.tx, ty: npc.ty, label: npc.name, npc: npc.id };
    });
  }
  const ok = reachable(t);
  if (job.kind === 'poste') {
    // o bloco embaixo do poste (o poste em si é sólido)
    const spots = t.lamps.map(l => [Math.floor(l.ground[0] / 16), Math.floor(l.ground[1] / 16) + 1] as [number, number]).filter(([x, y]) => ok.has(`${x},${y}`));
    const used = new Set<number>();
    return idx.map((i, n) => {
      let k = Math.floor(h01(c.seed, i) * spots.length);
      while (used.has(k) && used.size < spots.length) k = (k + 1) % spots.length;
      used.add(k);
      const p = spots[k] ?? spots[n % Math.max(1, spots.length)];
      return { i, tx: p[0], ty: p[1], label: 'poste queimado' };
    });
  }
  if (job.kind === 'porta') {
    const doors = t.doors.filter(d => ok.has(`${d.tx},${d.ty + 1}`));
    const used = new Set<number>();
    return idx.map((i, n) => {
      let k = Math.floor(h01(c.seed, i) * doors.length);
      while (used.has(k) && used.size < doors.length) k = (k + 1) % doors.length;
      used.add(k);
      const d = doors[k] ?? doors[n % Math.max(1, doors.length)];
      return { i, tx: d.tx, ty: d.ty + 1, label: d.name };
    });
  }
  // chão: lugares livres longe das portas e espalhados
  const doorTiles = new Set(t.doors.map(d => `${d.tx},${d.ty + 1}`));
  const free = [...ok].filter(k => !doorTiles.has(k)).map(k => k.split(',').map(Number) as [number, number])
    .filter(([x, y]) => x > 1 && y > 1 && x < t.solid[0].length - 2 && y < t.solid.length - 2).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const out: FieldTarget[] = [];
  for (const i of idx) {
    let tries = 0, p = free[Math.floor(h01(c.seed, i * 3 + 1) * free.length)];
    while (out.some(o => Math.abs(o.tx - p[0]) + Math.abs(o.ty - p[1]) < 10) && tries++ < 40) p = free[Math.floor(h01(c.seed, i * 3 + 1 + tries * 11) * free.length)];
    out.push({ i, tx: p[0], ty: p[1], label: 'ponto marcado' });
  }
  return out;
}

export function takeField(p: Progress, prof: ProfId, seed: number, now: number, jobId?: string): { progress: Progress } | { reason: string } {
  const job = jobId ? fieldsOf(prof).find(j => j.id === jobId) : fieldOf(prof);
  if (!job) return { reason: 'Esta profissão não tem trabalho de campo.' };
  if (p.campo) return { reason: 'Termine (ou cancele) o trabalho de campo que já pegou.' };
  if (job.need && (p.itens[job.need] ?? 0) < job.zones.length) return { reason: `Precisa de ${job.zones.length} na mochila (${job.need === 'pao' ? 'pães' : 'leites'}). Tem ${p.itens[job.need] ?? 0}.` };
  return { progress: { ...p, campo: { job: job.id, seed, feitos: [], ini: now } } };
}

export const cancelField = (p: Progress): Progress => ({ ...p, campo: undefined });

/** Tempo que falta (ms), ou null se não tem prazo. */
export function fieldLeft(p: Progress, now: number): number | null {
  const job = p.campo && FIELD_BY_ID.get(p.campo.job);
  return job?.minutes ? p.campo!.ini + job.minutes * 60_000 - now : null;
}

/** Cumpre o ponto `i`. No último, paga e solta o trabalho. */
export function completeTarget(p: Progress, i: number, now: number): { progress: Progress; line: string; done?: { coins: number; levelUp?: number }; reason?: undefined } | { reason: string } {
  const c = p.campo, job = c && FIELD_BY_ID.get(c.job);
  if (!c || !job || c.feitos.includes(i) || i < 0 || i >= job.zones.length) return { reason: 'Nada para fazer aqui.' };
  const left = fieldLeft(p, now);
  if (left !== null && left <= 0) return { reason: 'O prazo acabou: o trabalho foi cancelado.' };
  let next: Progress = p;
  if (job.need) {
    if ((p.itens[job.need] ?? 0) < 1) return { reason: 'Acabou o que você ia entregar. Busque mais!' };
    next = addItem(next, job.need, -1);
  }
  const feitos = [...c.feitos, i];
  if (feitos.length < job.zones.length) return { progress: { ...next, campo: { ...c, feitos } }, line: job.line };
  // 2 trabalhos de campo pagos por dia; depois, só experiência
  const day = today(now), paid = playsLeft(next, 'campo', day, PAID_PER_DAY.campo) > 0;
  const coins = paid ? job.coins : 0;
  const g = gainXp(spendPlay({ ...next, campo: undefined, coins: next.coins + coins }, 'campo', day), job.prof, job.xp);
  return { progress: g.progress, line: job.line, done: { coins, levelUp: g.levelUp } };
}

/** Quantos faltam em cada área (para a placa da tela e o mapa). */
export function pendingByZone(c: Campo): Partial<Record<ZoneId, number>> {
  const job = FIELD_BY_ID.get(c.job);
  const out: Partial<Record<ZoneId, number>> = {};
  job?.zones.forEach((z, i) => { if (!c.feitos.includes(i)) out[z] = (out[z] ?? 0) + 1; });
  return out;
}

/** Falas das entrevistas (viram a matéria). */
export const INTERVIEW = [
  'O que eu mais gosto daqui é que todo mundo se ajuda.',
  'Eu queria mais bancos na praça para ver o pôr do sol.',
  'Depois que os postes ficaram inteligentes, a rua ficou mais segura.',
  'Aqui a gente aprende fazendo: cada um tem uma profissão.',
  'Eu sonho em chegar no último andar da Torre!',
  'O lago está mais limpo desde que começaram a catar o lixo.',
];
/** O que cada morador quer comprar (pesquisa de mercado). */
export const WANTS = ['pão', 'peixe fresco', 'ovos', 'leite', 'abóbora', 'bolo', 'cenoura', 'morango'];
export const wantOf = (seed: number, i: number) => WANTS[Math.floor(h01(seed, i + 70) * WANTS.length)];
/** A tabela da pesquisa: quantas vezes cada coisa foi pedida (mais pedida primeiro). */
export function surveyTable(seed: number, n: number): [string, number][] {
  const m = new Map<string, number>();
  for (let i = 0; i < n; i++) { const w = wantOf(seed, i); m.set(w, (m.get(w) ?? 0) + 1); }
  return [...m].sort((a, b) => b[1] - a[1]);
}

export const interviewLine = (seed: number, i: number) => INTERVIEW[Math.floor(h01(seed, i + 40) * INTERVIEW.length)];
