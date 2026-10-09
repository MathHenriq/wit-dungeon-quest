// PvP online em tempo real (plano §11, H): dois alunos na mesma mesa LIVRE da
// Arena. Os dois aparelhos rodam o MESMO motor com a mesma semente; pela rede
// vai só a jogada ("joguei a carta X", "passei a vez"). A partida canônica tem
// o anfitrião no lugar 0; o convidado vê o espelho (mirrorState), sempre com
// "eu" no lugar 0, e as jogadas valem igual dos dois lados (o motor é
// simétrico: src/lib/tcg/__tests__/mirror.test.ts).
//
// Canal: 'wit2-todos-mesa-<n>' (aberto a todo aluno logado, como a cidade).
// Mensagens perdidas: cada jogada tem número; faltou uma, pede de novo.
// Saiu da mesa no meio: 60 s para voltar, depois vitória por W.O.
import { createGame } from '@/lib/tcg/engine';
import { mirrorState } from '@/lib/tcg/mirror';
import { CARD_BY_ID } from '@/lib/tcg/cards/catalog';
import { maxCopies } from '@/lib/tcg/opponents';
import type { CardDef, GameState } from '@/lib/tcg/types';
import type { Look } from './world/outfit';
import { cloudEnabled, rpc } from './cloud';

export type PvpAction = { t: 'play'; uid: string; discard?: string[] } | { t: 'end' } | { t: 'mull' } | { t: 'sniff'; bottom: boolean };
export interface PvpHello { tab: string; handle?: string; nick: string; look: Look; deck: string[] }
export interface PvpStart { key: string; seed: number; first: 0 | 1; host: PvpHello; guest: PvpHello }

export const WO_MS = 60_000;
export const tableTopic = (sala: string, mesa: string) => `wit2-${sala}-mesa-${mesa}`;

/** Quem é o anfitrião: a aba de id menor (os dois chegam à mesma conclusão sozinhos). */
export const hostOf = (a: PvpHello, b: PvpHello) => (a.tab < b.tab ? a : b);

/** Deck de 20 que respeita as cópias (o colega pode ter mexido no aparelho dele). */
export function validDeck(ids: unknown): CardDef[] | null {
  if (!Array.isArray(ids) || ids.length !== 20) return null;
  const count = new Map<string, number>();
  const out: CardDef[] = [];
  for (const id of ids) {
    const c = typeof id === 'string' ? CARD_BY_ID.get(id) : undefined;
    if (!c) return null;
    const n = (count.get(id) ?? 0) + 1;
    if (n > maxCopies(c)) return null;
    count.set(id, n);
    out.push(c);
  }
  return out;
}

/** A partida do ponto de vista de quem está jogando (eu sempre no lugar 0). */
export function buildMatch(st: PvpStart, iAmHost: boolean): GameState | null {
  const a = validDeck(st.host.deck), b = validDeck(st.guest.deck);
  if (!a || !b) return null;
  const canon = createGame([{ name: st.host.nick, deck: a }, { name: st.guest.nick, deck: b }], { seed: st.seed, firstPlayer: st.first });
  return iAmHost ? canon : mirrorState(canon);
}

/** Fila de jogadas recebidas: entrega na ordem, avisa se faltou alguma. */
export class ActionQueue {
  private next = 0;
  private held = new Map<number, PvpAction>();
  /** Recebeu a jogada `n`: devolve as que já dá para aplicar, em ordem, e se falta alguma antes. */
  push(n: number, a: PvpAction): { ready: PvpAction[]; missing: number | null } {
    if (n >= this.next) this.held.set(n, a);
    const ready: PvpAction[] = [];
    while (this.held.has(this.next)) { ready.push(this.held.get(this.next)!); this.held.delete(this.next); this.next++; }
    const missing = this.held.size ? this.next : null;
    return { ready, missing };
  }
  get expected() { return this.next; }
}

export interface TableHandlers {
  /** Achou adversário: a partida começa (eu sou o anfitrião?). */
  onStart: (st: PvpStart, iAmHost: boolean) => void;
  onAction: (a: PvpAction) => void;
  /** O adversário saiu (true) ou voltou (false). */
  onAway: (away: boolean) => void;
}
export interface TableLink { send: (a: PvpAction) => void; leave: () => void }

/** Senta na mesa online. Sem o banco ligado (ou sem perfil) devolve null. */
export async function joinTable(sala: string | null, mesa: string, me: PvpHello, h: TableHandlers): Promise<TableLink | null> {
  if (!cloudEnabled() || !sala) return null;
  const { supabaseStudent } = await import('@/integrations/supabase/studentClient');
  const ch = supabaseStudent.channel(tableTopic(sala, mesa), { config: { private: true, presence: { key: me.tab }, broadcast: { self: false } } });
  let start: PvpStart | null = null;
  const mine: PvpAction[] = [];
  const queue = new ActionQueue();
  let foeTab: string | null = null;

  ch.on('presence', { event: 'sync' }, () => {
    const all = Object.values(ch.presenceState() as Record<string, PvpHello[]>).flat().filter(x => x && typeof x.tab === 'string');
    const other = all.find(x => x.tab !== me.tab);
    if (start) { h.onAway(!all.some(x => x.tab === foeTab)); return; }
    if (!other) return;
    // dois na mesa: o anfitrião sorteia e manda o começo
    if (hostOf(me, other).tab === me.tab) {
      start = { key: `${me.tab}-${other.tab}-${Date.now()}`, seed: (Math.random() * 0x7fffffff) | 1, first: Math.random() < 0.5 ? 0 : 1, host: me, guest: other };
      foeTab = other.tab;
      void ch.send({ type: 'broadcast', event: 'start', payload: start });
      h.onStart(start, true);
    }
  });
  ch.on('broadcast', { event: 'start' }, ({ payload }) => {
    const st = payload as PvpStart;
    if (start || st.guest?.tab !== me.tab) return;
    start = st; foeTab = st.host.tab;
    h.onStart(st, false);
  });
  ch.on('broadcast', { event: 'act' }, ({ payload }) => {
    const { n, a } = payload as { n: number; a: PvpAction };
    const r = queue.push(n, a);
    r.ready.forEach(h.onAction);
    if (r.missing !== null) void ch.send({ type: 'broadcast', event: 'need', payload: { from: r.missing } });
  });
  ch.on('broadcast', { event: 'need' }, ({ payload }) => {
    const from = (payload as { from: number }).from;
    mine.slice(from).forEach((a, i) => { void ch.send({ type: 'broadcast', event: 'act', payload: { n: from + i, a } }); });
  });
  ch.subscribe(status => { if (status === 'SUBSCRIBED') void ch.track(me); });
  return {
    send: a => { mine.push(a); void ch.send({ type: 'broadcast', event: 'act', payload: { n: mine.length - 1, a } }); },
    leave: () => { void ch.untrack(); void supabaseStudent.removeChannel(ch); },
  };
}

/** Resultado no banco (sem moedas: só o placar). Os dois lados mandam; vale quando batem. */
export const reportPvp = (key: string, foeHandle: string | undefined, won: boolean) =>
  (cloudEnabled() && foeHandle ? rpc<boolean>('wit2_pvp_report', { p_key: key, p_opp: foeHandle, p_won: won }).catch(() => false) : Promise.resolve(false));
