import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Ability, BattleCharacter, ElementType } from '@/types/character';
import { canUseAbility } from '@/types/character';

// ─── Fetch all abilities (joined with elements) ───────────────────────────────

export function useAbilities() {
  return useQuery({
    queryKey: ['battle', 'abilities'],
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<Ability[]> => {
      const { data, error } = await supabase
        .from('abilities')
        .select(`
          *,
          elements:element_id (
            name,
            icon_url,
            color_hex
          )
        `)
        .order('element_id', { ascending: true })
        .order('tier',       { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id:           row.id,
        name:         row.name,
        elementId:    row.element_id,
        elementName:  row.elements?.name as ElementType,
        tier:         row.tier as 1 | 2 | 3 | 4,
        damageType:   row.damage_type,
        baseDamage:   row.base_damage ?? 0,
        energyCost:   row.energy_cost ?? 0,
        accuracy:     row.accuracy ?? 100,
        requirement:  row.requirement ?? 0,
        effectType:   row.effect_type,
        effectChance: row.effect_chance,
        effectValue:  row.effect_value,
        description:  row.description ?? '',
        elementColor: row.elements?.color_hex,
        elementIcon:  row.elements?.icon_url,
      }));
    },
    staleTime: 10 * 60_000, // abilities rarely change
  });
}

// ─── Fetch abilities for a single element ─────────────────────────────────────

export function useAbilitiesByElement(element: ElementType | null) {
  return useQuery({
    queryKey: ['battle', 'abilities', element],
    enabled:  !!element,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    queryFn: async (): Promise<Ability[]> => {
      const { data, error } = await supabase
        .from('abilities')
        .select(`*, elements:element_id (name, icon_url, color_hex)`)
        .eq('elements.name', element)
        .order('tier', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id:          row.id,
        name:        row.name,
        elementId:   row.element_id,
        elementName: row.elements?.name as ElementType,
        tier:        row.tier,
        damageType:  row.damage_type,
        baseDamage:  row.base_damage ?? 0,
        energyCost:  row.energy_cost ?? 0,
        accuracy:    row.accuracy ?? 100,
        requirement: row.requirement ?? 0,
        effectType:  row.effect_type,
        effectChance:row.effect_chance,
        description: row.description ?? '',
        elementColor:row.elements?.color_hex,
      }));
    },
  });
}

// ─── Fetch equipped abilities for a character ─────────────────────────────────

export function useEquippedAbilities(characterId: string | null) {
  return useQuery({
    queryKey: ['battle', 'equipped', characterId],
    enabled:  !!characterId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_abilities')
        .select('ability_id, slot')
        .eq('character_id', characterId!)
        .order('slot', { ascending: true });

      if (error) throw error;
      return (data ?? []) as { ability_id: string; slot: number }[];
    },
  });
}

// ─── Equip an ability ─────────────────────────────────────────────────────────

export function useEquipAbility(characterId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ abilityId, slot }: { abilityId: string; slot: 1 | 2 | 3 | 4 }) => {
      // Upsert into the slot (replaces whatever was there)
      const { error } = await supabase
        .from('character_abilities')
        .upsert({ character_id: characterId, ability_id: abilityId, slot }, { onConflict: 'character_id,slot' });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['battle', 'equipped', characterId] });
      toast.success('Habilidade equipada!');
    },
    onError: (err: any) => {
      toast.error('Erro ao equipar: ' + err.message);
    },
  });
}

// ─── Unequip an ability ───────────────────────────────────────────────────────

export function useUnequipAbility(characterId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (slot: 1 | 2 | 3 | 4) => {
      const { error } = await supabase
        .from('character_abilities')
        .delete()
        .eq('character_id', characterId)
        .eq('slot', slot);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['battle', 'equipped', characterId] });
      toast.success('Habilidade removida.');
    },
    onError: (err: any) => {
      toast.error('Erro ao remover: ' + err.message);
    },
  });
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Filter abilities the character can currently use */
export function getAvailableAbilities(character: BattleCharacter, abilities: Ability[]): Ability[] {
  return abilities.filter(a => canUseAbility(character, a));
}

/** Group abilities by element */
export function groupByElement(abilities: Ability[]): Record<string, Ability[]> {
  return abilities.reduce((acc, a) => {
    const key = a.elementName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {} as Record<string, Ability[]>);
}
