// Social do WIT 2 (plano §11): perfil público, amizades, visitas, denúncias e
// guilda. Tudo passa pelas funções de supabase/migrations/*_wit2_social.sql;
// o colega só vê apelido, visual, título e números do jogo (nunca nome ou id:
// quem aparece é um `handle` aleatório). Com o banco desligado, as telas
// mostram "precisa estar online"; `?social=demo` usa dados de mentira (prints).
import type { Look } from './world/outfit';
import { cloudEnabled, rpc, rpcTeacher } from './cloud';
import type { Level } from './arcade';

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

let myself: Me | null = null;
/** O meu perfil público (handle e canal da cidade), depois que a cidade publicou. */
export const socialMe = () => myself;
export const setProfile = (nick: string, title: string | undefined, look: Look, favs: string[]) =>
  call<Me>('wit2_set_profile', { p_nick: nick, p_title: title ?? null, p_look: look, p_favs: favs.slice(0, 3) }, () => ({ handle: 'demo-eu', muted: false, sala: null }))
    .then(m => { myself = m; return m; });
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

// ─── rankings do Salão dos Campeões (supabase/migrations/*_wit2_tudo_global.sql) ──
// Todos os alunos de todos os professores; contas de teste ficam fora.
export interface RankPerson { pos: number; handle: string; nick: string; title?: string | null; look: Partial<Look>; eu: boolean }
export interface RankPlayer extends RankPerson { andar: number; cartas: number; guilda?: string | null }
export interface RankDuelist extends RankPerson { vitorias: number; semana: number; duelos: number }
export interface RankGuild { pos: number; name: string; emblem: number; membros: number; golpes: number; chefeCaiu: boolean; minha: boolean }
export interface Ranking<T, Me> { top: T[]; eu: Me | null; total: number }

const DEMO_NICKS = ['Rafa', 'Lia', 'Kaio', 'Nina', 'Theo', 'Bia', 'Enzo', 'Luna', 'Davi', 'Maya', 'Ravi', 'Iris', 'Noah', 'Clara', 'Ian', 'Sofia', 'Leo', 'Duda'];
const DEMO_TITLES = ['Duelista', 'Pescadora', 'Mestre da Torre', 'Novato', 'Lenda', null, 'Colecionador', 'Rank S'];
const demoLook = (k: number): Partial<Look> => DEMO_LOOK(`modelo-${String((k * 3) % 10 + 1).padStart(2, '0')}`, ['azul', 'rosa', 'verde', 'vermelho', 'amarelo', 'roxo'][k % 6]);
const demoPeople = <T,>(f: (k: number) => T) => DEMO_NICKS.map((nick, k) => ({
  pos: k + 1, handle: `demo-${k}`, nick, title: DEMO_TITLES[k % DEMO_TITLES.length], look: demoLook(k), eu: k === 6, ...f(k),
}));

export const rankPlayers = () => call<Ranking<RankPlayer, { pos: number; andar: number; cartas: number }>>('wit2_rank_players', undefined, () => ({
  top: demoPeople(k => ({ andar: Math.max(1, 87 - k * 5 - (k % 3)), cartas: 260 - k * 9, guilda: ['Os Brabos', 'Dragões', null, 'Lobos da Torre'][k % 4] })),
  eu: { pos: 7, andar: 55, cartas: 206 }, total: 214,
}));
export const rankPvp = () => call<Ranking<RankDuelist, { pos: number; vitorias: number; semana: number }>>('wit2_rank_pvp', undefined, () => ({
  top: demoPeople(k => ({ vitorias: Math.max(1, 48 - k * 3 + (k % 2)), semana: Math.max(0, 9 - k), duelos: 70 - k * 3 })),
  eu: { pos: 7, vitorias: 30, semana: 3 }, total: 96,
}));
export const rankGuilds = () => call<Ranking<RankGuild, { pos: number; golpes: number; name: string }>>('wit2_rank_guilds', undefined, () => ({
  top: ['Os Brabos', 'Dragões de Fogo', 'Lobos da Torre', 'Guardiões', 'Os Magos', 'Tempestade', 'Estrelas WIT', 'Os Piratas'].map((name, k) => ({
    pos: k + 1, name, emblem: (k * 5) % 12, membros: 12 - k, golpes: 140 - k * 16, chefeCaiu: k < 2, minha: k === 0,
  })),
  eu: { pos: 1, golpes: 140, name: 'Os Brabos' }, total: 23,
}));

// professor
export interface ReportRow { id: number; reason: ReportReason; at: string; alvo: string; alvoApelido: string | null; quem: string }
export const teacherReports = () => (cloudEnabled() ? rpcTeacher<ReportRow[]>('wit2_teacher_reports') : Promise.resolve<ReportRow[]>([]));
export const teacherResolve = (id: number, action: 'ok' | 'silenciar' | 'apelido') => rpcTeacher<boolean>('wit2_teacher_resolve', { p_report: id, p_action: action });

// ─── trocas, Vitrine e Mercado da turma (supabase/migrations/*_wit2_trades.sql) ──
export interface TradeRow {
  id: number; eu: 'ofereci' | 'recebi'; com: { handle: string; nick: string } | null;
  daCards: Record<string, number>; daCoins: number; recebeCards: Record<string, number>; recebeCoins: number;
  status: 'aberta' | 'feita' | 'recusada' | 'cancelada'; aberta: boolean; at: string;
}
export interface Listing { id: number; card: string; price: number; minha: boolean; nick: string | null; at: string }

const DEMO_TRADES: TradeRow[] = [
  { id: 1, eu: 'recebi', com: { handle: 'demo-lia', nick: 'Lia' }, daCards: { 'excalibur-de-arthur': 1 }, daCoins: 0, recebeCards: { 'mago-negro': 1 }, recebeCoins: 30, status: 'aberta', aberta: true, at: '' },
  { id: 2, eu: 'ofereci', com: { handle: 'demo-rafa', nick: 'Rafa' }, daCards: { enma: 2 }, daCoins: 0, recebeCards: { disaster: 1 }, recebeCoins: 0, status: 'aberta', aberta: true, at: '' },
];
const DEMO_VITRINE: Listing[] = [
  { id: 1, card: 'disaster', price: 140, minha: false, nick: 'Rafa', at: '' },
  { id: 2, card: 'gura-gura-no-mi', price: 180, minha: false, nick: 'Lia', at: '' },
  { id: 3, card: 'enma', price: 35, minha: true, nick: 'Você', at: '' },
];

const TRADE_ERRORS: Record<string, string> = {
  'troca inválida': 'Troca inválida.', 'ofertas demais': 'Você já tem 5 ofertas abertas.', 'só cartas repetidas': 'Só cartas repetidas entram.',
  'troca não encontrada': 'Essa troca não está mais aberta.', 'troca não vale mais': 'Alguém já não tem o que prometeu: a troca foi cancelada.',
  'preço fora da faixa': 'Preço fora da faixa da raridade.', 'vitrine cheia': 'Você já tem 5 cartas à venda.', 'já foi vendida': 'Alguém comprou antes.',
  'moedas insuficientes': 'Moedas insuficientes.', 'colega não encontrado': 'Colega não encontrado.',
};
export const tradeError = (e: unknown) => TRADE_ERRORS[e instanceof Error ? e.message : ''] ?? socialError(e);

export const tradeView = (handle: string) => call<{ nick: string; spare: Record<string, number> }>('wit2_trade_view', { p_handle: handle },
  () => ({ nick: DEMO_PEOPLE.find(p => p.handle === handle)?.nick ?? 'Colega', spare: { 'mago-negro': 1, disaster: 2, 'gura-gura-no-mi': 1 } }));
export const tradeOffer = (handle: string, give: Record<string, number>, giveCoins: number, want: Record<string, number>, wantCoins: number) =>
  call<number>('wit2_trade_offer', { p_handle: handle, p_give: give, p_give_coins: giveCoins, p_want: want, p_want_coins: wantCoins }, () => 3);
export const tradeAnswer = (id: number, accept: boolean) => call<string>('wit2_trade_answer', { p_id: id, p_accept: accept }, () => (accept ? 'feita' : 'recusada'));
export const tradeCancel = (id: number) => call<boolean>('wit2_trade_cancel', { p_id: id }, () => true);
export const tradesMine = () => call<TradeRow[]>('wit2_trades_mine', undefined, () => DEMO_TRADES);
export const vitrine = () => call<Listing[]>('wit2_vitrine', undefined, () => DEMO_VITRINE);
export const listCard = (card: string, price: number) => call<number>('wit2_list_card', { p_card: card, p_price: price }, () => 9);
export const unlist = (id: number) => call<boolean>('wit2_unlist', { p_id: id }, () => true);
export const buyListing = (id: number) => call<{ card: string; coins: number }>('wit2_buy_listing', { p_id: id }, () => ({ card: DEMO_VITRINE.find(l => l.id === id)?.card ?? 'enma', coins: 0 }));
/** Mercado da turma: quanto cada item está "cheio" hoje (null offline). */
export const marketState = () => (cloudEnabled() ? rpc<{ day: number; sat: Record<string, number> }>('wit2_market_state').catch(() => null) : Promise.resolve(null));
export const marketSold = (item: string, n: number) => (cloudEnabled() ? rpc<{ day: number; sat: Record<string, number> }>('wit2_market_sold', { p_item: item, p_n: Math.min(50, n) }).catch(() => null) : Promise.resolve(null));

// ─── mural da turma, fases do fliperama e festa (supabase/migrations/*_wit2_world.sql) ──
/** Frases prontas do mural (sem texto livre). */
export const MURAL_FRASES = [
  'Subi de andar na Torre!', 'Abri um pacotinho incrível!', 'Quem quer trocar cartas?', 'Alguém para um PvP?', 'Pesquei um peixe raro!',
  'Minha fazenda está linda!', 'Compus uma música nova no Estúdio!', 'Minha casa ficou demais!', 'Bora fazer a missão da sala!', 'Obrigado pela troca!',
  'Criei uma fase no fliperama!', 'Venci o chefe da guilda!', 'Bom dia, turma!', 'Boa aula, pessoal!', 'Quem chega no andar 10 primeiro?',
];
export interface Post {
  id: number; kind: 'frase' | 'foto' | 'fase'; frase: number | null; foto: string | null; fase: Level | null; titulo: number | null;
  plays: number; at: string; minha: boolean; esperando: boolean; nick: string | null; handle: string | null;
}
const DEMO_POSTS: Post[] = [
  { id: 1, kind: 'fase', frase: null, foto: null, fase: { w: 12, h: 8, t: '#############s..o.#...o##.##.#.#.#.##.o#...x...##.##.###.#.##.....o..#.##.#####...e#############' }, titulo: 0, plays: 7, at: '', minha: false, esperando: false, nick: 'Rafa', handle: 'demo-rafa' },
  { id: 2, kind: 'frase', frase: 4, foto: null, fase: null, titulo: null, plays: 0, at: '', minha: false, esperando: false, nick: 'Lia', handle: 'demo-lia' },
  { id: 3, kind: 'frase', frase: 3, foto: null, fase: null, titulo: null, plays: 0, at: '', minha: true, esperando: false, nick: 'Você', handle: 'demo-eu' },
];
export const muralPosts = () => call<Post[]>('wit2_mural', undefined, () => DEMO_POSTS);
export const postFrase = (i: number) => call<number>('wit2_post', { p_kind: 'frase', p_frase: i, p_foto: null, p_fase: null, p_titulo: null }, () => 9);
export const postFoto = (data: string) => call<number>('wit2_post', { p_kind: 'foto', p_frase: null, p_foto: data, p_fase: null, p_titulo: null }, () => 9);
export const postFase = (l: Level, titulo: number) => call<number>('wit2_post', { p_kind: 'fase', p_frase: null, p_foto: null, p_fase: l, p_titulo: titulo }, () => 9);
export const deletePost = (id: number) => call<boolean>('wit2_post_delete', { p_id: id }, () => true);
export const levelPlayed = (id: number) => (cloudEnabled() ? rpc<null>('wit2_level_played', { p_id: id }).catch(() => null) : Promise.resolve(null));
export const party = () => call<number>('wit2_party', undefined, () => 2);
export const noticesMine = () => (cloudEnabled() ? rpc<{ kind: 'festa'; handle: string; nick: string; at: string }[]>('wit2_notices_mine').catch(() => []) : Promise.resolve([]));
export interface TeacherPost { id: number; kind: Post['kind']; frase: number | null; foto: string | null; at: string; esperando: boolean; aluno: string }
export const teacherPosts = () => (cloudEnabled() ? rpcTeacher<TeacherPost[]>('wit2_teacher_posts') : Promise.resolve<TeacherPost[]>([]));
export const moderatePost = (id: number, ok: boolean) => rpcTeacher<boolean>('wit2_teacher_post_moderate', { p_id: id, p_ok: ok });
