import type { StudentTab } from '@/components/student/StudentNavigation';

export type ArenaTab = 'arena' | 'ranking' | 'history';

export interface PvpProfile {
  student_id: string;
  name: string;
  initials: string;
  elo: number;
  wins: number;
  losses: number;
  level: number;
  online?: boolean;
}

export interface MatchHistory {
  id: string;
  opponent: string;
  opponentInitials: string;
  opponentRank: string;
  result: 'win' | 'loss';
  eloChange: number;
  bet: string | null;
  timeAgo: string;
}

export interface Division {
  name: string;
  tier: number;
  color: string;
}

export const DIVISIONS_CONFIG = [
  { name: 'Ferro',    color: 'rgba(160,160,170,0.7)',  eloRange: [0,    599]  as [number, number] },
  { name: 'Bronze',   color: 'rgba(180,120,80,0.7)',   eloRange: [600,  899]  as [number, number] },
  { name: 'Prata',    color: 'rgba(180,180,200,0.8)',  eloRange: [900,  1199] as [number, number] },
  { name: 'Ouro',     color: 'rgba(201,164,74,0.8)',   eloRange: [1200, 1499] as [number, number] },
  { name: 'Platina',  color: 'rgba(120,200,220,0.8)',  eloRange: [1500, 1799] as [number, number] },
  { name: 'Diamante', color: 'rgba(180,130,255,0.8)',  eloRange: [1800, 9999] as [number, number] },
] as const;

export function getDivision(elo: number): Division {
  for (const div of DIVISIONS_CONFIG) {
    if (elo >= div.eloRange[0] && elo <= div.eloRange[1]) {
      const range = div.eloRange[1] - div.eloRange[0] + 1;
      const tierSize = Math.floor(range / 3);
      const offset = elo - div.eloRange[0];
      const tier = Math.max(1, 3 - Math.floor(offset / tierSize));
      return { name: div.name, tier, color: div.color };
    }
  }
  return { name: 'Ferro', tier: 3, color: DIVISIONS_CONFIG[0].color };
}

export function calculateEloChange(playerElo: number, opponentElo: number, won: boolean, K = 32): number {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(K * ((won ? 1 : 0) - expected));
}

// Mock data
export const MOCK_SELF: PvpProfile = {
  student_id: 'user-1',
  name: 'Matheus Henrique',
  initials: 'MH',
  elo: 1247,
  wins: 28,
  losses: 14,
  level: 12,
};

export const MOCK_CLASSMATES: PvpProfile[] = [
  { student_id: 'u2', name: 'Lucas Almeida',   initials: 'LA', elo: 1180, wins: 22, losses: 18, level: 10, online: true  },
  { student_id: 'u3', name: 'Bruna Santos',    initials: 'BS', elo: 1420, wins: 35, losses: 12, level: 14, online: true  },
  { student_id: 'u4', name: 'Rafael Ferreira', initials: 'RF', elo: 980,  wins: 14, losses: 16, level: 9,  online: true  },
  { student_id: 'u5', name: 'Julia Oliveira',  initials: 'JO', elo: 750,  wins: 8,  losses: 12, level: 7,  online: false },
  { student_id: 'u6', name: 'Pedro Costa',     initials: 'PC', elo: 1310, wins: 30, losses: 16, level: 13, online: false },
  { student_id: 'u7', name: 'Ana Martins',     initials: 'AM', elo: 1050, wins: 18, losses: 15, level: 10, online: false },
];

export const MOCK_HISTORY: MatchHistory[] = [
  { id: 'h1', opponent: 'Lucas Almeida',   opponentInitials: 'LA', opponentRank: 'Ouro III',   result: 'win',  eloChange: 18,  bet: '50 moedas',       timeAgo: '2h' },
  { id: 'h2', opponent: 'Bruna Santos',    opponentInitials: 'BS', opponentRank: 'Platina I',  result: 'loss', eloChange: -12, bet: null,               timeAgo: '5h' },
  { id: 'h3', opponent: 'Rafael Ferreira', opponentInitials: 'RF', opponentRank: 'Prata II',   result: 'win',  eloChange: 14,  bet: 'Espada de Ferro',  timeAgo: '1d' },
  { id: 'h4', opponent: 'Ana Martins',     opponentInitials: 'AM', opponentRank: 'Prata I',    result: 'win',  eloChange: 16,  bet: null,               timeAgo: '1d' },
  { id: 'h5', opponent: 'Pedro Costa',     opponentInitials: 'PC', opponentRank: 'Ouro I',     result: 'loss', eloChange: -15, bet: '100 moedas',       timeAgo: '2d' },
  { id: 'h6', opponent: 'Julia Oliveira',  opponentInitials: 'JO', opponentRank: 'Bronze I',   result: 'win',  eloChange: 8,   bet: null,               timeAgo: '3d' },
];
