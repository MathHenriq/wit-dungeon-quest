import { useQuery } from '@tanstack/react-query';
import { supabaseAnon } from '@/integrations/supabase/anonClient';
import type { ShopItem } from '@/types';

// Loads the equipped shop_item that grants an in-battle ability.
// Picks the item explicitly equipped in the Carta Especial slot. Older rows
// without equipped_slot are ignored so armamento/armadura never steal this slot.
//
// Returns null when nothing is equipped or no equipped item exposes a battle ability.
export function useEquippedItem(studentId: string | null | undefined) {
  return useQuery({
    queryKey: ['battle', 'equippedItem', studentId],
    enabled:  !!studentId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ShopItem | null> => {
      const { data, error } = await supabaseAnon
        .from('student_inventory')
        .select('id, equipped_slot, item:item_id (*)')
        .eq('student_id', studentId!)
        .eq('is_equipped', true)
        .eq('equipped_slot', 'carta_especial');

      if (error) throw error;

      const rows = (data ?? []) as Array<{ id: string; equipped_slot: string | null; item: ShopItem | null }>;
      const withAbility = rows
        .map(r => r.item)
        .filter((it): it is ShopItem => !!it && !!it.ability_key);

      return withAbility[0] ?? null;
    },
  });
}
