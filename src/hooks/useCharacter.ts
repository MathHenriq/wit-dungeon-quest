import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { BattleCharacter, ElementType } from '@/types/character';

// ─── Row → domain ─────────────────────────────────────────────────────────────

function rowToCharacter(row: any): BattleCharacter {
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
      const { error } = await supabase
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
      toast.success(`+${vars.amount} ponto(s) em ${vars.element}!`);
    },
    onError: (err: any) => {
      toast.error(err.message ?? 'Erro ao distribuir pontos.');
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
    onError: (err: any) => {
      toast.error('Erro ao criar personagem: ' + err.message);
    },
  });
}
