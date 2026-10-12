// Missões do dia (mural da praça e Núcleo WIT): três por dia, iguais para
// todo mundo no mesmo dia, contadas a partir dos contadores (`stats`) do
// começo do dia. Cada uma paga moedas ao ser recebida.
import type { Progress } from './progress';
import { today } from './life';

export interface MissionDef { id: string; stat: string; target: number; reward: number; text: string }

export const MISSION_POOL: MissionDef[] = [
  { id: 'pescar-3', stat: 'peixes', target: 3, reward: 15, text: 'Pesque 3 peixes' },
  { id: 'pescar-8', stat: 'peixes', target: 8, reward: 35, text: 'Pesque 8 peixes' },
  { id: 'colher-4', stat: 'colheitas', target: 4, reward: 15, text: 'Colha 4 plantas na fazenda' },
  { id: 'regar-10', stat: 'regas', target: 10, reward: 12, text: 'Regue 10 canteiros' },
  { id: 'bichos-2', stat: 'bichos', target: 2, reward: 12, text: 'Pegue ovos, leite ou lã 2 vezes' },
  { id: 'mesas-2', stat: 'mesas', target: 2, reward: 30, text: 'Vença 2 mesas na Torre' },
  { id: 'mesas-4', stat: 'mesas', target: 4, reward: 55, text: 'Vença 4 mesas na Torre' },
  { id: 'jogos-2', stat: 'minijogos', target: 2, reward: 20, text: 'Trabalhe 2 vezes (minijogos das profissões)' },
  { id: 'entrega-1', stat: 'entregas', target: 1, reward: 20, text: 'Faça 1 entrega da Central de Entregas' },
  { id: 'vender-5', stat: 'vendas', target: 5, reward: 15, text: 'Venda 5 itens no Mercado Central' },
  { id: 'cozinhar-1', stat: 'receitas', target: 1, reward: 15, text: 'Cozinhe 1 receita na Casa da Fazenda' },
  { id: 'comer-2', stat: 'comidas', target: 2, reward: 8, text: 'Coma 2 vezes' },
];

/** As 3 missões do dia (sempre de contadores diferentes; uma de Torre a cada dois dias). */
export function missionsOf(day: number): MissionDef[] {
  const out: MissionDef[] = [];
  let k = day * 7;
  while (out.length < 3) {
    const m = MISSION_POOL[(k * 5 + 3) % MISSION_POOL.length];
    k++;
    if (out.some(o => o.stat === m.stat)) continue;
    if (m.stat === 'mesas' && day % 2) continue;
    out.push(m);
  }
  return out;
}

/** Garante que as missões estão no dia de hoje (no dia novo, guarda os contadores de agora como ponto de partida). */
export function syncMissions(p: Progress, day = today()): Progress {
  if (p.missoes.day === day) return p;
  return { ...p, missoes: { day, base: { ...p.stats }, feitas: [] } };
}

export function missionProgress(p: Progress, m: MissionDef): number {
  return Math.min(m.target, (p.stats[m.stat] ?? 0) - (p.missoes.base[m.stat] ?? 0));
}

export function claimMission(p: Progress, id: string, day = today()): { ok: true; progress: Progress; coins: number } | { ok: false; reason: string } {
  const q = syncMissions(p, day);
  const m = missionsOf(day).find(x => x.id === id);
  if (!m) return { ok: false, reason: 'Essa missão não é de hoje.' };
  if (q.missoes.feitas.includes(id)) return { ok: false, reason: 'Você já recebeu essa.' };
  if (missionProgress(q, m) < m.target) return { ok: false, reason: 'Ainda falta um pouco!' };
  return { ok: true, progress: { ...q, coins: q.coins + m.reward, missoes: { ...q.missoes, feitas: [...q.missoes.feitas, id] } }, coins: m.reward };
}
