import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseStudent } from '@/integrations/supabase/studentClient';
import { toast } from 'sonner';
import type { BattleCharacter, ElementType } from '@/types/character';
import {
  processXPGain,
  getTotalXPForLevel,
  getPointsForLevelUp,
  type XPReward,
} from '@/lib/progression/xpCalculator';
import type { Database } from '@/integrations/supabase/types';

// ─── Row → domain ─────────────────────────────────────────────────────────────

// A linha vem de `characters` com um subconjunto de colunas dependendo da
// query, e todos os campos abaixo tem valor padrao — Partial descreve isso sem
// o `any` que antes deixava qualquer renomeacao de coluna passar em silencio.
type CharacterRow = Partial<Database['public']['Tables']['characters']['Row']>;

function rowToCharacter(row: CharacterRow): BattleCharacter {
  return {
    id:           row.id,
    userId:       row.user_id,
    name:         row.name ?? '',
    class:        row.class ?? '',
    level:        row.level ?? 1,
    xp:           row.xp ?? 0,
    hpCurrent:    row.hp_current ?? 0,
    hpMax:        row.hp_max ?? 100,
    energyMax:    row.energy_max ?? 100,
    forca:        row.forca ?? 10,
    inteligencia: row.inteligencia ?? 10,
    destreza:     row.destreza ?? 10,
    carisma:      row.carisma ?? 10,
    agilidade:    row.agilidade ?? 10,
    resistencia:  row.resistencia ?? 10,
    ptsFire:      row.pts_fire ?? 0,
    ptsWater:     row.pts_water ?? 0,
    ptsElectric:  row.pts_electric ?? 0,
    ptsGrass:     row.pts_grass ?? 0,
    ptsIce:       row.pts_ice ?? 0,
    ptsGround:    row.pts_ground ?? 0,
    ptsFighting:  row.pts_fighting ?? 0,
    ptsSteel:     row.pts_steel ?? 0,
    ptsPoison:    row.pts_poison ?? 0,
    ptsDark:      row.pts_dark ?? 0,
    ptsGhost:     row.pts_ghost ?? 0,
    ptsFlying:    row.pts_flying ?? 0,
    freePoints:   row.free_points ?? 0,
    spriteNormal:       row.sprite_normal,
    spritePixelFront:   row.sprite_pixel_front,
    spritePixelBack:    row.sprite_pixel_back,
    spritePixelAttack:  row.sprite_pixel_attack,
  };
}

// ─── Fetch character by userId ────────────────────────────────────────────────

export function useCharacter(userId: string | null) {
  return useQuery({
    queryKey: ['battle', 'character', userId],
    enabled:  !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async (): Promise<BattleCharacter | null> => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return data ? rowToCharacter(data) : null;
    },
  });
}

// ─── Fetch character by characterId ──────────────────────────────────────────

export function useCharacterById(characterId: string | null) {
  return useQuery({
    queryKey: ['battle', 'character-by-id', characterId],
    enabled:  !!characterId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnReconnect: false,
    queryFn: async (): Promise<BattleCharacter | null> => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId!)
        .maybeSingle();

      if (error) throw error;
      return data ? rowToCharacter(data) : null;
    },
  });
}

// ─── Distribute element points ────────────────────────────────────────────────

const ELEMENT_COL: Record<ElementType, string> = {
  Fire:     'pts_fire',
  Water:    'pts_water',
  Electric: 'pts_electric',
  Grass:    'pts_grass',
  Ice:      'pts_ice',
  Ground:   'pts_ground',
  Fighting: 'pts_fighting',
  Steel:    'pts_steel',
  Poison:   'pts_poison',
  Dark:     'pts_dark',
  Ghost:    'pts_ghost',
  Flying:   'pts_flying',
};

export function useDistributePoints(characterId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      element,
      amount,
      currentFreePoints,
      currentElementPoints,
    }: {
      element: ElementType;
      amount: number;
      currentFreePoints: number;
      currentElementPoints: number;
    }) => {
      if (amount > currentFreePoints) throw new Error('Pontos insuficientes!');
      if (amount <= 0) throw new Error('Informe um valor maior que 0.');

      const col = ELEMENT_COL[element];
      const { error } = await supabaseStudent
        .from('characters')
        .update({
          [col]: currentElementPoints + amount,
          free_points: currentFreePoints - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', characterId);

      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['battle', 'character-by-id', characterId] });
      qc.invalidateQueries({ queryKey: ['battle-character'] });
      toast.success(`+${vars.amount} ponto(s) em ${vars.element}!`);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Erro ao distribuir pontos.');
    },
  });
}

// ─── Apply battle rewards — XP, coins, and automatic level-up ────────────────

export function useApplyBattleRewards(characterId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ xp, coins }: { xp: number; coins: number }): Promise<XPReward> => {
      // 1. Fetch character to get user_id and base stats
      const { data: char, error: fetchErr } = await supabaseStudent
        .from('characters')
        // Must stay a single string literal: PostgREST infers the row type
        // from it, and a concatenated expression degrades every field to
        // GenericStringError (which is why char.user_id, char.forca and the
        // rest all stopped type-checking here).
        .select('id, user_id, level, xp, coins, free_points, forca, inteligencia, destreza, carisma, agilidade, resistencia, hp_max, hp_current, energy_max')
        .eq('id', characterId)
        .single();

      if (fetchErr) throw fetchErr;
      if (!char.user_id) throw new Error('Personagem sem usuário vinculado.');

      // 2. Fetch student as the source of truth for coins and XP
      const { data: student, error: studentErr } = await supabaseStudent
        .from('students')
        .select('coins, xp, level')
        .eq('user_id', char.user_id)
        .single();

      if (studentErr) throw studentErr;

      // 3. Level-up maths, computed from the pre-battle snapshot.
      const currentLevel  = student.level ?? 1;
      const xpBase        = Math.max(student.xp ?? 0, getTotalXPForLevel(currentLevel));

      const spentOnPastLevels = getTotalXPForLevel(currentLevel);
      const currentLevelXP    = Math.max(0, xpBase - spentOnPastLevels);
      const xpResult          = processXPGain(currentLevel, currentLevelXP, xp);

      // 4. Credit XP and coins.
      //
      //    This used to be a read-modify-write from the client: read coins,
      //    add in JS, write the total back. Anything that wrote in between was
      //    silently lost — and in a classroom that is routine, because a
      //    student finishes a battle at the same moment the teacher grants
      //    coins from the panel or a shop purchase debits. apply_battle_rewards
      //    applies the daily cap and does `coins = coins + n` in one
      //    transaction, so the database serialises the writes instead.
      const { data: creditData, error: creditErr } = await supabaseStudent
        .rpc('apply_battle_rewards', { p_xp: xp, p_coins: coins });

      const rpcMissing =
        !!creditErr && /could not find|does not exist|PGRST202|42883/i.test(
          `${creditErr.message ?? ''} ${creditErr.code ?? ''}`,
        );

      if (creditErr && !rpcMissing) throw creditErr;

      if (rpcMissing) {
        // The migration adding the RPC has not been pushed yet. Fall back to
        // the old non-atomic path so the game keeps working, and say so loudly
        // enough that it gets noticed in the console.
        console.warn(
          '[useApplyBattleRewards] apply_battle_rewards ausente — usando caminho antigo, nao atomico. ' +
          'Rode: npx supabase db push --linked',
        );
        let effectiveCoins = coins;
        if (coins > 0) {
          const { data: capResult, error: capErr } = await supabaseStudent
            .rpc('apply_daily_coin_cap', { p_amount: coins });
          if (capErr) {
            console.warn('[useApplyBattleRewards] apply_daily_coin_cap failed; crediting raw amount', capErr);
          } else if (capResult && typeof (capResult as { effective?: number }).effective === 'number') {
            effectiveCoins = (capResult as { effective: number }).effective;
          }
        }
        const { error: sUpdateErr } = await supabaseStudent
          .from('students')
          .update({ coins: (student.coins ?? 0) + effectiveCoins, xp: xpBase + xp })
          .eq('user_id', char.user_id);
        if (sUpdateErr) throw sUpdateErr;
      } else {
        const credited = creditData as { error?: string } | null;
        if (credited?.error) throw new Error(`apply_battle_rewards: ${credited.error}`);
      }

      // 5. students.level is handled entirely by the database and must NOT be
      //    written from here. Two triggers make that so:
      //      - auto_level_up recomputes NEW.level from NEW.xp on every xp change
      //      - enforce_student_character_update_only raises
      //        'level can only change via xp gain' if a student touches level
      //        without also moving xp
      //    So a standalone level UPDATE throws, and a bundled one is ignored.
      //    The old code sent level along with coins/xp and the trigger simply
      //    overwrote it; xpResult below is used only for the victory screen.

      // 6. Handle character-specific level-up rewards
      if (xpResult.leveledUp && xpResult.newLevel) {
        const newLevel     = xpResult.newLevel;
        const levelsGained = xpResult.levelsGained ?? 1;
        const bonuses      = getPointsForLevelUp(levelsGained);

        const { error: cUpdateErr } = await supabaseStudent
          .from('characters')
          .update({
            forca:        (char.forca        ?? 10) + bonuses.attributePoints,
            inteligencia: (char.inteligencia ?? 10) + bonuses.attributePoints,
            destreza:     (char.destreza     ?? 10) + bonuses.attributePoints,
            carisma:      (char.carisma      ?? 10) + bonuses.attributePoints,
            agilidade:    (char.agilidade    ?? 10) + bonuses.attributePoints,
            resistencia:  (char.resistencia  ?? 10) + bonuses.attributePoints,
            hp_max:       Math.max(100 + (newLevel - 1) * 10, char.hp_max    ?? 100),
            hp_current:   Math.max(100 + (newLevel - 1) * 10, char.hp_max    ?? 100),
            energy_max:   Math.max(100 + (newLevel - 1) * 5,  char.energy_max ?? 100),
            free_points:  (char.free_points ?? 0) + bonuses.freePoints,
            updated_at:   new Date().toISOString(),
          })
          .eq('id', characterId);

        if (cUpdateErr) throw cUpdateErr;
      }

      return xpResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['battle-character'] });
      qc.invalidateQueries({ queryKey: ['battle', 'character-by-id', characterId] });
      qc.invalidateQueries({ queryKey: ['battle', 'character'] });
      // Patch 2.3: refresh the daily coin cap HUD bar.
      qc.invalidateQueries({ queryKey: ['daily-coins-summary'] });
    },
    onError: (err: Error) => {
      toast.error('Erro ao salvar recompensas: ' + (err.message ?? 'Erro desconhecido'));
    },
  });
}

// ─── Create character ─────────────────────────────────────────────────────────

export function useCreateCharacter() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      name: string;
      class: string;
    }) => {
      const { data, error } = await supabase
        .from('characters')
        .insert({
          user_id:    payload.userId,
          name:       payload.name,
          class:      payload.class,
          level:      1,
          xp:         0,
          hp_current: 100,
          hp_max:     100,
          energy_max: 100,
          free_points: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return rowToCharacter(data);
    },
    onSuccess: (char) => {
      qc.invalidateQueries({ queryKey: ['battle', 'character', char.userId] });
      toast.success('Personagem criado!');
    },
    onError: (err: Error) => {
      toast.error('Erro ao criar personagem: ' + err.message);
    },
  });
}
