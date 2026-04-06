// ── Guild UI types & mock data ──────────────────────────────────────────────

export type GuildTab = 'chat' | 'members' | 'missions' | 'ranking' | 'settings';

export const EMBLEM_SYMBOLS = [
  'shield', 'sword', 'crown', 'dragon', 'wolf', 'phoenix', 'star', 'rune',
] as const;
export type EmblemSymbol = typeof EMBLEM_SYMBOLS[number];

export const EMBLEM_COLORS = [
  '#825ADB', '#DB5A5A', '#5ADB8B', '#DBA55A',
  '#5AADB8', '#DB5AA0', '#A0DB5A', '#B8905A',
] as const;
export type EmblemColor = typeof EMBLEM_COLORS[number];

// ── Mock missions ────────────────────────────────────────────────────────────

export interface GuildMission {
  id: string;
  title: string;
  description: string;
  reward_xp: number;
  reward_coins: number;
  difficulty: 'easy' | 'normal' | 'hard';
  progress: number;   // 0–100
  required: number;   // total participants needed
  current: number;    // participants so far
  deadline: string;   // display string
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

// ── Mock ranking (guild leaderboard within the class) ────────────────────────

export interface GuildRankEntry {
  id: string;
  name: string;
  emblem: EmblemSymbol;
  emblem_color: EmblemColor;
  level: number;
  xp: number;
  member_count: number;
  wins: number;
}

export const MOCK_RANKING: GuildRankEntry[] = [
  { id: 'g1', name: 'ORDEM DO DRAGÃO',  emblem: 'dragon',  emblem_color: '#DB5A5A', level: 8,  xp: 2400, member_count: 5, wins: 22 },
  { id: 'g2', name: 'ESCUDO DE PRATA',  emblem: 'shield',  emblem_color: '#5AADB8', level: 7,  xp: 2150, member_count: 6, wins: 18 },
  { id: 'g3', name: 'LÂMINAS DO VENTO', emblem: 'sword',   emblem_color: '#5ADB8B', level: 6,  xp: 1900, member_count: 4, wins: 14 },
  { id: 'g4', name: 'COROA DO SOL',     emblem: 'crown',   emblem_color: '#DBA55A', level: 5,  xp: 1600, member_count: 5, wins: 11 },
  { id: 'g5', name: 'ALCATEIA SOMBRIA', emblem: 'wolf',    emblem_color: '#825ADB', level: 4,  xp: 1200, member_count: 3, wins: 7  },
];
