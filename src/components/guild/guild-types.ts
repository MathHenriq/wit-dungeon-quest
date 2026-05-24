// ── Guild UI types & constants ────────────────────────────────────────────────

export type GuildTab = 'chat' | 'members' | 'missions' | 'ranking' | 'development' | 'raid' | 'requests' | 'settings';

// ── Role hierarchy ────────────────────────────────────────────────────────────

export type GuildRole =
  | 'lider'
  | 'vice_lider'
  | 'capitao'
  | 'major'
  | 'tenente'
  | 'soldado';

export const ROLE_RANK: Record<GuildRole, number> = {
  lider:      1,
  vice_lider: 2,
  capitao:    3,
  major:      4,
  tenente:    5,
  soldado:    6,
};

export const ROLE_LABELS: Record<GuildRole, string> = {
  lider:      'Líder',
  vice_lider: 'Vice-Líder',
  capitao:    'Capitão',
  major:      'Major',
  tenente:    'Tenente',
  soldado:    'Soldado',
};

export const ROLE_COLORS: Record<GuildRole, string> = {
  lider:      'rgba(255,215,0,0.90)',
  vice_lider: 'rgba(255,165,0,0.85)',
  capitao:    'rgba(130,90,219,0.90)',
  major:      'rgba(90,173,184,0.85)',
  tenente:    'rgba(90,219,139,0.80)',
  soldado:    'rgba(255,255,255,0.35)',
};

/** Returns true if `actor` is allowed to kick `target` */
export function canKickMember(actor: GuildRole, target: GuildRole): boolean {
  if (actor !== 'lider' && actor !== 'vice_lider') return false;
  return ROLE_RANK[actor] < ROLE_RANK[target];
}

// ── Emblems ───────────────────────────────────────────────────────────────────

export const EMBLEM_SYMBOLS = [
  'shield', 'sword', 'crown', 'dragon',
  'wolf',   'phoenix', 'star', 'rune',
  'axe',    'bow',    'fire', 'lightning',
  'skull',  'eye',    'hammer', 'chalice',
] as const;
export type EmblemSymbol = typeof EMBLEM_SYMBOLS[number];

export const EMBLEM_COLORS = [
  '#825ADB', '#DB5A5A', '#5ADB8B', '#DBA55A',
  '#5AADB8', '#DB5AA0', '#A0DB5A', '#B8905A',
  '#5A7ADB', '#E8A040', '#40E8C8', '#E84080',
] as const;
export type EmblemColor = typeof EMBLEM_COLORS[number];

// ── Ranking entry ─────────────────────────────────────────────────────────────

export interface GuildRankEntry {
  id: string;
  name: string;
  emblem: EmblemSymbol;
  emblem_color: EmblemColor | string;
  level: number;
  xp: number;
  member_count: number;
  total_pvp_wins: number;
  total_member_xp: number;
  avg_member_level: number;
  score: number;
}

// ── Mission types (for UI) ────────────────────────────────────────────────────

export interface GuildMission {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  reward_coins: number;
  difficulty: 'easy' | 'normal' | 'hard';
  progress: number;
  required: number;
  current: number;
  deadline: string;
  completed: boolean;
}

export const MOCK_MISSIONS: GuildMission[] = [
  {
    id: 'm1',
    title: 'FORÇA COLETIVA',
    description: 'Cada membro deve completar 1 missão individual esta semana.',
    reward_xp: 500, reward_coins: 80,
    difficulty: 'normal',
    progress: 60, required: 5, current: 3,
    deadline: '2 dias',
    completed: false,
  },
  {
    id: 'm2',
    title: 'VANGUARDA DO SABER',
    description: 'A guilda deve acumular 1000 XP combinados em batalhas.',
    reward_xp: 800, reward_coins: 120,
    difficulty: 'hard',
    progress: 42, required: 1000, current: 420,
    deadline: '5 dias',
    completed: false,
  },
  {
    id: 'm3',
    title: 'PRESENÇA GARANTIDA',
    description: 'Todos os membros marcaram presença na mesma semana.',
    reward_xp: 300, reward_coins: 50,
    difficulty: 'easy',
    progress: 100, required: 5, current: 5,
    deadline: 'Concluída',
    completed: true,
  },
];
