// Recompensas da Sala (plano §4.4): o aluno troca moedas por um ticket de
// algo de verdade na aula (tablet, música da Alexa, óculos VR). O ticket fica
// "na fila" até o professor entregar com um toque. Preço proporcional ao tempo
// e ao trabalho; cada professor pode ajustar o catálogo (por enquanto, o padrão).
// Funções puras: o progresso entra e sai.
import type { Progress } from './progress';

export interface RoomReward { id: string; nome: string; preco: number; icone: string; sobre: string }

export const ROOM_REWARDS: RoomReward[] = [
  { id: 'musica', nome: 'Escolher a música da aula', preco: 600, icone: 'nota', sobre: 'A Alexa toca a música que você escolher (sem palavrão).' },
  { id: 'tablet-15', nome: 'Tablet ou celular, 15 min', preco: 600, icone: 'notebook', sobre: '15 minutos de jogo livre no fim da aula.' },
  { id: 'lugar', nome: 'Escolher o lugar na sala', preco: 400, icone: 'estrela', sobre: 'Senta onde quiser na próxima aula.' },
  { id: 'ajudante', nome: 'Ajudante do professor', preco: 800, icone: 'medalha', sobre: 'Você ajuda a passar a atividade e a corrigir.' },
  { id: 'vr-10', nome: 'Óculos VR, 10 min', preco: 2000, icone: 'oculos-vr', sobre: '10 minutos com os óculos de realidade virtual.' },
  { id: 'impressao-3d', nome: 'Peça na impressora 3D', preco: 5000, icone: 'trofeu', sobre: 'Uma peça pequena impressa para você levar.' },
];
export const REWARD_BY_ID = new Map(ROOM_REWARDS.map(r => [r.id, r]));

export interface Ticket {
  /** Código curto que o aluno mostra ao professor. */
  code: string;
  reward: string;
  preco: number;
  /** Dia (dias desde 1970) em que comprou. */
  dia: number;
  entregue?: number;
}

/** No máximo 3 tickets esperando ao mesmo tempo (para não virar estoque). */
export const MAX_PENDING = 3;

/** Código de 4 letras sem letras confusas (sem O/0, I/1). */
export function ticketCode(n: number): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let x = Math.abs(Math.floor(n)) % (A.length ** 4), s = '';
  for (let i = 0; i < 4; i++) { s = A[x % A.length] + s; x = Math.floor(x / A.length); }
  return s;
}

export const pending = (p: Progress) => p.tickets.filter(t => !t.entregue);

export function buyReward(p: Progress, id: string, dia: number, seed: number): { ok: true; progress: Progress; ticket: Ticket } | { ok: false; reason: string } {
  const r = REWARD_BY_ID.get(id);
  if (!r) return { ok: false, reason: 'Recompensa não existe.' };
  if (pending(p).length >= MAX_PENDING) return { ok: false, reason: `Você já tem ${MAX_PENDING} tickets esperando o professor.` };
  if (p.coins < r.preco) return { ok: false, reason: `Faltam ${r.preco - p.coins} moedas.` };
  const used = new Set(p.tickets.map(t => t.code));
  let k = seed, code = ticketCode(k);
  while (used.has(code)) code = ticketCode(++k);
  const ticket: Ticket = { code, reward: id, preco: r.preco, dia };
  return { ok: true, ticket, progress: { ...p, coins: p.coins - r.preco, tickets: [ticket, ...p.tickets].slice(0, 30) } };
}

/** O professor entregou (marca o ticket; não devolve moedas). */
export function deliverTicket(p: Progress, code: string, dia: number): Progress {
  return { ...p, tickets: p.tickets.map(t => (t.code === code && !t.entregue ? { ...t, entregue: dia } : t)) };
}

/** Desistiu antes da entrega: devolve as moedas. */
export function cancelTicket(p: Progress, code: string): Progress {
  const t = p.tickets.find(x => x.code === code && !x.entregue);
  return t ? { ...p, coins: p.coins + t.preco, tickets: p.tickets.filter(x => x !== t) } : p;
}
