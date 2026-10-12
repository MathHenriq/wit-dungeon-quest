// Cidade compartilhada (plano §3.1 e §11): cada área é um canal do Supabase
// Realtime; cada aluno avisa só "fui para o bloco X" (não a posição a cada
// quadro). DESLIGADO por padrão: liga junto com o banco (VITE_WIT2_DB=1).
// Só apelido, título e visual aparecem para os outros (nada de dado pessoal).
import type { Dir } from './world/movement';
import type { Look } from './world/outfit';
import { cloudEnabled } from './cloud';

/** Frases prontas do balão (sem texto livre: público infantil, nada a moderar). */
export const FALAS = ['Oi!', 'Bora duelar?', 'Boa partida!', 'Valeu!', 'Me segue!', 'Tchau!', 'Quer trocar carta?', 'Parabéns!'] as const;
export const FALA_MS = 4000;

/** `id` = a aba; `handle` = o perfil público (abre o cartão; nunca o id do aluno). */
export interface PeerState { id: string; handle?: string; nick: string; title?: string; look: Look; tx: number; ty: number; dir: Dir; fala?: { i: number; t: number } }

/** Lista dos colegas a partir do estado do canal (tira a gente mesmo e repetidos). */
export function peersFromState(state: Record<string, unknown[]>, myId: string): PeerState[] {
  const out = new Map<string, PeerState>();
  for (const metas of Object.values(state)) {
    for (const m of metas as Partial<PeerState>[]) {
      if (!m || typeof m.id !== 'string' || m.id === myId) continue;
      if (typeof m.tx !== 'number' || typeof m.ty !== 'number' || !m.look) continue;
      out.set(m.id, { id: m.id, handle: typeof m.handle === 'string' ? m.handle.slice(0, 16) : undefined, nick: String(m.nick ?? 'Colega').slice(0, 20), title: m.title ? String(m.title).slice(0, 24) : undefined, look: m.look, tx: m.tx, ty: m.ty, dir: (m.dir ?? 'south') as Dir, fala: validFala(m.fala) });
    }
  }
  return [...out.values()].slice(0, 40);   // canal cheio: mostra até 40
}

function validFala(f: unknown): PeerState['fala'] {
  const v = f as { i?: unknown; t?: unknown } | undefined;
  return v && typeof v.i === 'number' && Number.isInteger(v.i) && v.i >= 0 && v.i < FALAS.length && typeof v.t === 'number' ? { i: v.i, t: v.t } : undefined;
}

/** Id desta aba (um aluno com duas abas aparece duas vezes, de propósito simples). */
export function tabId(): string {
  try {
    let id = sessionStorage.getItem('wit.tab');
    if (!id) { id = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('wit.tab', id); }
    return id;
  } catch { return Math.random().toString(36).slice(2, 10); }
}

export interface ZoneLink { move: (tx: number, ty: number, dir: Dir) => void; say: (i: number) => void; leave: () => void }

/** Nome do canal: só a turma do mesmo professor (`sala`) entra (política em _wit2_social.sql). */
export const zoneTopic = (sala: string, zone: string) => `wit2-${sala}-${zone}`;

/** Entra no canal da área. Sem o banco ligado (ou sem turma) devolve null (a cidade fica só com os moradores). */
export async function joinZone(zone: string, me: PeerState, onPeers: (peers: PeerState[]) => void, sala: string | null): Promise<ZoneLink | null> {
  if (!cloudEnabled() || !sala) return null;
  const { supabaseStudent } = await import('@/integrations/supabase/studentClient');
  const ch = supabaseStudent.channel(zoneTopic(sala, zone), { config: { private: true, presence: { key: me.id } } });
  let cur = me;
  ch.on('presence', { event: 'sync' }, () => onPeers(peersFromState(ch.presenceState() as Record<string, unknown[]>, me.id)));
  ch.subscribe(status => { if (status === 'SUBSCRIBED') ch.track(cur); });
  return {
    move: (tx, ty, dir) => {
      if (tx === cur.tx && ty === cur.ty && dir === cur.dir) return;
      cur = { ...cur, tx, ty, dir };
      ch.track(cur);
    },
    say: i => { cur = { ...cur, fala: { i, t: Date.now() } }; ch.track(cur); },
    leave: () => { ch.untrack(); supabaseStudent.removeChannel(ch); },
  };
}
