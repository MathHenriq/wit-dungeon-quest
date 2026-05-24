// Patch 3.1 — call apply_battle_materials after a kill.
// Lives next to applyBattleDrops so both end-of-battle drop systems
// stay together. Returns the rows the RPC handed back, so the UI
// can show "+1 Fragmento Arcano" toasts.

import { supabaseStudent } from '@/integrations/supabase/studentClient';

export type MaterialRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface MaterialDrop {
  materialId:  string;
  name:        string;
  rarity:      MaterialRarity;
  theme:       string;
  iconUrl:     string | null;
  quantity:    number;
}

interface RpcRow {
  out_material_id: string;
  out_name:        string;
  out_rarity:      MaterialRarity;
  out_theme:       string;
  out_icon_url:    string | null;
  out_quantity:    number;
}

export async function applyBattleMaterials(
  studentId:    string,
  enemyId:      string,
  floorNumber:  number,
): Promise<MaterialDrop[]> {
  const { data, error } = await supabaseStudent.rpc('apply_battle_materials', {
    p_student_id:   studentId,
    p_enemy_id:     enemyId,
    p_floor_number: floorNumber,
  });
  if (error) {
    console.error('[applyBattleMaterials] RPC failed', error);
    return [];
  }
  const rows = (data ?? []) as RpcRow[];
  return rows.map((r) => ({
    materialId: r.out_material_id,
    name:       r.out_name,
    rarity:     r.out_rarity,
    theme:      r.out_theme,
    iconUrl:    r.out_icon_url,
    quantity:   r.out_quantity,
  }));
}
