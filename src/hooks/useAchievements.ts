import { useCallback, useRef, useState } from 'react';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import type { Achievement } from '@/lib/achievements/achievementChecker';

/**
 * Desbloqueio de conquistas.
 *
 * Toda a decisão mora na RPC `check_my_achievements`: ela recalcula os totais
 * das tabelas de origem (vitórias, bosses, nível, PvP, pontos elementais),
 * destrava o que foi atingido, credita moedas e diamantes integrais e escreve
 * em `achievement_feed` — tudo numa transação. O cliente não manda contador
 * nenhum, então não há número para o aluno forjar.
 *
 * Conquista fica fora do teto diário de moedas de propósito: o teto existe
 * contra farm de boss, e conquista só acontece uma vez.
 *
 * Não confundir com `src/lib/achievements/achievementChecker.ts`, que faz a
 * mesma coisa pelo cliente e está obsoleto: ele creditava em
 * `characters.coins` (a fonte de verdade é `students.coins`) e por
 * read-modify-write, o mesmo padrão de corrida que a `apply_battle_rewards`
 * veio corrigir.
 */

interface RpcUnlocked {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  reward_coins: number | null;
  reward_diamonds: number | null;
}

interface RpcResposta {
  unlocked?: RpcUnlocked[];
  totals?: Record<string, number>;
  error?: string;
}

function paraAchievement(row: RpcUnlocked): Achievement {
  return {
    id:               row.id,
    name:             row.name,
    description:      row.description ?? '',
    category:         row.category ?? 'battle',
    iconUrl:          null,
    requirementType:  '',
    requirementValue: 0,
    rewardCoins:      row.reward_coins ?? 0,
    rewardDiamonds:   row.reward_diamonds ?? 0,
    isSecret:         false,
    isUnlocked:       true,
  };
}

export function useAchievements() {
  const [pendentes, setPendentes] = useState<Achievement[]>([]);
  /** Evita duas verificações simultâneas (ex.: vitória e foco da aba juntos). */
  const rodandoRef = useRef(false);

  const check = useCallback(async () => {
    if (rodandoRef.current) return;
    rodandoRef.current = true;
    try {
      const { data, error } = await supabaseStudent.rpc('check_my_achievements');
      if (error) {
        console.warn('[useAchievements] check_my_achievements falhou:', error);
        return;
      }
      const res = (data ?? {}) as RpcResposta;
      const novas = res.unlocked ?? [];
      if (novas.length > 0) setPendentes(novas.map(paraAchievement));
    } catch (err) {
      // Conquista é bônus: nunca deve atrapalhar o fluxo que a chamou.
      console.warn('[useAchievements] erro inesperado:', err);
    } finally {
      rodandoRef.current = false;
    }
  }, []);

  const clear = useCallback(() => setPendentes([]), []);

  return { pendentes, check, clear };
}
