// Social do WIT 2 (plano §11): perfil público, amizades, visitas, denúncias e
// guilda. Tudo passa pelas funções de supabase/migrations/*_wit2_social.sql;
// o colega só vê apelido, visual, título e números do jogo (nunca nome ou id:
// quem aparece é um `handle` aleatório). Com o banco desligado, as telas
// mostram "precisa estar online"; `?social=demo` usa dados de mentira (prints).
import type { Look } from './world/outfit';
import { cloudEnabled, rpc, rpcTeacher } from './cloud';

export interface PublicProfile {
  handle: string;
  nick: string;
  title?: string | null;
  look: Partial<Look>;
  favs: string[];
  andar: number;
  caminho?: string | null;
  guilda?: string | null;
  /** Como está a amizade com quem vê. */
  amizade?: 'amigos' | 'enviado' | 'recebido' | null;
}
export interface FriendRow extends PublicProfile { estado: 'amigos' | 'enviado' | 'recebido' }
export interface GuildMember extends PublicProfile { role: 'lider' | 'membro'; hits: number; eu: boolean; mentor: string | null; presente: boolean }
export interface GuildInfo { name: string; code: string; emblem: number; bossHp: number; bossMax: number; premio: boolean; members: GuildMember[] }
export interface Me { handle: string; muted: boolean; sala: string | null }

export const REPORT_REASONS = [
  { id: 'apelido', label: 'Apelido feio' },
  { id: 'balao', label: 'Atrapalhando com o balão' },
  { id: 'troca', label: 'Troca injusta' },
  { id: 'outro', label: 'Outra coisa' },
] as const;
export type ReportReason = typeof REPORT_REASONS[number]['id'];

/** Mesmo filtro do servidor (wit2_nick_ok): 2 a 16 letras, números e espaço, sem palavrão. */
const BAD = /(merd|bost|porr|caralh|puta|put4|fod|cuz|buce|piroc|viad|otari|idiot|burr|lix[oa]|retardad|xot|pint[oa]|cacet|desgra|arromb)/;
export function nickOk(nick: string): boolean {
  const n = nick.trim();
  if (!/^[A-Za-zÀ-ÿ0-9 ]{2,16}$/.test(n)) return false;
  const flat = n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't');
  return !BAD.test(flat);
}

/** Guilda: barra do chefe da semana (0..1, 1 = cheio). */
export const bossShare = (g: Pick<GuildInfo, 'bossHp' | 'bossMax'>) => (g.bossMax > 0 ? Math.max(0, Math.min(1, g.bossHp / g.bossMax)) : 0);
/** Meta de presença da semana: quantos membros vieram em pelo menos 1 aula. */
export const presenceGoal = (g: Pick<GuildInfo, 'members'>) => ({ done: g.members.filter(m => m.presente).length, total: g.members.length });

export const socialDemo = (): boolean => {
  try { return new URLSearchParams(window.location.search).get('social') === 'demo'; } catch { return false; }
};
export const socialOn = () => cloudEnabled() || socialDemo();

// ─── dados de mentira (só ?social=demo, para prints e testes de tela) ────────
const DEMO_LOOK = (modelo: string, cima: string): Partial<Look> => ({ modelo, pele: 'pele-3', cabelo: 'castanho', cima, baixo: 'jeans' } as Partial<Look>);
export const DEMO_PEOPLE: PublicProfile[] = [
  { handle: 'demo-lia', nick: 'Lia', title: 'Pescadora', look: DEMO_LOOK('modelo-02', 'rosa'), favs: ['excalibur-de-arthur', 'enma', 'disaster'], andar: 7, caminho: 'sabio', guilda: 'Os Brabos', amizade: 'amigos' },
  { handle: 'demo-rafa', nick: 'Rafa', title: 'Duelista', look: DEMO_LOOK('modelo-01', 'azul'), favs: ['mago-negro'], andar: 12, caminho: 'louco', guilda: 'Os Brabos', amizade: null },
];
const DEMO_GUILD: GuildInfo = {
  name: 'Os Brabos', code: 'K7P2Q', emblem: 3, bossHp: 37, bossMax: 90, premio: false,
  members: [
    { ...DEMO_PEOPLE[1], role: 'lider', hits: 11, eu: false, mentor: null, presente: true },
    { ...DEMO_PEOPLE[0], role: 'membro', hits: 6, eu: false, mentor: 'demo-rafa', presente: true },
    { handle: 'demo-eu', nick: 'Você', title: 'Novato', look: {}, favs: [], andar: 3, role: 'membro', hits: 4, eu: true, mentor: null, presente: false },
  ],
};

// ─── chamadas ────────────────────────────────────────────────────────────────
const OFFLINE = 'Precisa estar online (com o banco ligado).';
async function call<T>(fn: string, args: Record<string, unknown> | undefined, demo: () => T): Promise<T> {
  if (socialDemo()) return demo();
  if (!cloudEnabled()) throw new Error(OFFLINE);
  return rpc<T>(fn, args);
}
/** Mensagem curta para a tela a partir do erro do servidor. */
export function socialError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  const known = ['apelido não permitido', 'colega não encontrado', 'pedidos demais', 'só amigos visitam', 'já está numa guilda', 'nome não permitido',
    'guilda não encontrada', 'guilda cheia', 'mentor precisa ser da guilda', 'mentor precisa estar 5 andares acima', 'o chefe ainda está de pé'];
  if (m === OFFLINE || known.includes(m)) return m.charAt(0).toUpperCase() + m.slice(1) + (m.endsWith('.') ? '' : '.');
  return 'Sem conexão com o servidor. Tente de novo.';
}

export const setProfile = (nick: string, title: string | undefined, look: Look, favs: string[]) =>
  call<Me>('wit2_set_profile', { p_nick: nick, p_title: title ?? null, p_look: look, p_favs: favs.slice(0, 3) }, () => ({ handle: 'demo-eu', muted: false, sala: null }));
export const profileOf = (handle: string) =>
  call<PublicProfile | null>('wit2_profile_of', { p_handle: handle }, () => DEMO_PEOPLE.find(p => p.handle === handle) ?? null);
export const friendRequest = (handle: string) => call<'enviado' | 'amigos'>('wit2_friend_request', { p_handle: handle }, () => 'enviado');
export const friendAnswer = (handle: string, ok: boolean) => call<string>('wit2_friend_answer', { p_handle: handle, p_ok: ok }, () => (ok ? 'amigos' : 'removido'));
export const friendsList = () => call<FriendRow[]>('wit2_friends_list', undefined, () => [
  { ...DEMO_PEOPLE[0], estado: 'amigos' }, { ...DEMO_PEOPLE[1], estado: 'recebido' },
]);
export const saveHouse = (layout: unknown) => (cloudEnabled() ? rpc<boolean>('wit2_save_house', { p_layout: layout }).catch(() => false) : Promise.resolve(false));
export const visit = (handle: string) => call<{ layout: unknown; dono: PublicProfile }>('wit2_visit', { p_handle: handle }, () => ({ layout: null, dono: DEMO_PEOPLE[0] }));
export const report = (handle: string, reason: ReportReason) => call<boolean>('wit2_report', { p_handle: handle, p_reason: reason }, () => true);

export const guildInfo = () => call<GuildInfo | null>('wit2_guild_info', undefined, () => DEMO_GUILD);
export const guildCreate = (name: string, emblem: number) => call<{ code: string }>('wit2_guild_create', { p_name: name, p_emblem: emblem }, () => ({ code: 'K7P2Q' }));
export const guildJoin = (code: string) => call<boolean>('wit2_guild_join', { p_code: code }, () => true);
export const guildLeave = () => call<boolean>('wit2_guild_leave', undefined, () => true);
export const guildMentor = (handle: string | null) => call<boolean>('wit2_guild_mentor', { p_handle: handle }, () => true);
export const guildClaim = () => call<boolean>('wit2_guild_claim', undefined, () => true);
/** Vitória na Torre bate no chefe da guilda (sem guilda ou offline: nada). */
export const guildHit = () => (cloudEnabled() ? rpc<{ bossHp: number } | null>('wit2_guild_hit').catch(() => null) : Promise.resolve(null));

// professor
export interface ReportRow { id: number; reason: ReportReason; at: string; alvo: string; alvoApelido: string | null; quem: string }
export const teacherReports = () => (cloudEnabled() ? rpcTeacher<ReportRow[]>('wit2_teacher_reports') : Promise.resolve<ReportRow[]>([]));
export const teacherResolve = (id: number, action: 'ok' | 'silenciar' | 'apelido') => rpcTeacher<boolean>('wit2_teacher_resolve', { p_report: id, p_action: action });
