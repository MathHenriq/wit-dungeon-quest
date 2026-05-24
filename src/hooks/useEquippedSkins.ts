// Shared lookup for the caller's equipped card skins.
// Backed by a single TanStack Query cache so every consumer hits the same
// in-flight request and gets cache-level deduping.

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseStudent } from '@/integrations/supabase/studentClient';

export interface EquippedSkin {
  base_card_id: string;
  skin_id:      string;
  visual_data:  { image_url?: string; frame_style?: string; animation?: string } & Record<string, unknown>;
}

export type EquippedSkinMap = Record<string, EquippedSkin>;

export const EQUIPPED_SKINS_QUERY_KEY = ['equipped-skins'] as const;

export function useEquippedSkins() {
  const query = useQuery<EquippedSkin[]>({
    queryKey: EQUIPPED_SKINS_QUERY_KEY,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabaseStudent.rpc('get_my_equipped_skins');
      if (error) {
        console.warn('[useEquippedSkins] rpc failed:', error);
        return [];
      }
      return (data ?? []) as EquippedSkin[];
    },
  });

  const map = useMemo<EquippedSkinMap>(() => {
    const acc: EquippedSkinMap = {};
    for (const row of query.data ?? []) {
      if (row?.base_card_id) acc[row.base_card_id] = row;
    }
    return acc;
  }, [query.data]);

  return { skinsByBaseId: map, isLoading: query.isLoading };
}

/**
 * Resolve the effective image URL for a shop item, falling back to the base
 * item image when no skin is equipped (or when the skin lacks an image_url).
 */
export function resolveItemImage(
  item: { id?: string | null; image_url?: string | null } | null | undefined,
  skinsByBaseId: EquippedSkinMap,
): string | null {
  if (!item) return null;
  const skin = item.id ? skinsByBaseId[item.id] : undefined;
  return skin?.visual_data?.image_url ?? item.image_url ?? null;
}
