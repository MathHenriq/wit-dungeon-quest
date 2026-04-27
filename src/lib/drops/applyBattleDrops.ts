import { supabaseStudent } from '@/integrations/supabase/studentClient';
import type { DropResult, DropRarity } from './dropTypes';

interface RpcDropRow {
  drop_item_id:    string;
  name:            string;
  rarity:          DropRarity;
  floor_theme:     string;
  base_sell_value: number;
  quantity:        number;
}

export async function applyBattleDrops(
  studentId: string,
  enemyId:   string,
): Promise<DropResult[]> {
  const { data, error } = await supabaseStudent.rpc('apply_battle_drops', {
    p_student_id: studentId,
    p_enemy_id:   enemyId,
  });

  if (error) {
    console.error('[applyBattleDrops] RPC failed', error);
    return [];
  }

  const rows = (data ?? []) as RpcDropRow[];
  return rows.map((r) => ({
    dropItemId:    r.drop_item_id,
    name:          r.name,
    rarity:        r.rarity,
    floorTheme:    r.floor_theme,
    baseSellValue: r.base_sell_value,
    quantity:      r.quantity,
  }));
}
