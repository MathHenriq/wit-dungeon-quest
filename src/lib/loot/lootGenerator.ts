import { supabase } from '@/integrations/supabase/client';
import { calculateXPGain } from '@/lib/progression/xpCalculator';

export interface LootDrop {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: string;
}

export interface BattleRewards {
  xp: number;
  coins: number;
  diamonds: number;
  items: LootDrop[];
}

export function calculateCoinReward(enemyLevel: number, isBoss: boolean): number {
  let coins = 10 * enemyLevel;
  if (isBoss) coins *= 3;
  // Variação aleatória ±20%
  coins *= 0.8 + Math.random() * 0.4;
  return Math.floor(coins);
}

export function calculateDiamondReward(_isBoss: boolean, _bossLevel: number): number {
  // Patch 2.0 — diamantes NÃO vêm de batalhas (apenas do professor).
  return 0;
}

export async function generateLoot(floorId: number, isBoss: boolean): Promise<LootDrop[]> {
  const { data: lootTable } = await supabase
    .from('loot_tables')
    .select(`
      drop_chance, min_quantity, max_quantity,
      items:item_id ( id, name, rarity )
    `)
    .eq('floor_id', floorId)
    .eq('is_boss', isBoss);

  if (!lootTable || lootTable.length === 0) return [];

  const drops: LootDrop[] = [];

  for (const entry of lootTable) {
    if (Math.random() < entry.drop_chance) {
      const quantity =
        Math.floor(Math.random() * (entry.max_quantity - entry.min_quantity + 1)) +
        entry.min_quantity;

      const item = entry.items as { id: string; name: string; rarity: string };
      drops.push({
        itemId: item.id,
        itemName: item.name,
        quantity,
        rarity: item.rarity
      });
    }
  }

  return drops;
}

export async function processBattleRewards(
  characterId: string,
  characterLevel: number,
  enemyLevel: number,
  isBoss: boolean,
  floorId: number
): Promise<BattleRewards> {
  const xp = calculateXPGain(characterLevel, enemyLevel, isBoss);
  const coins = calculateCoinReward(enemyLevel, isBoss);
  const diamonds = calculateDiamondReward(isBoss, enemyLevel);
  const items = await generateLoot(floorId, isBoss);

  // Atualizar moedas e diamantes do personagem
  const { data: char } = await supabase
    .from('characters')
    .select('coins, diamonds')
    .eq('id', characterId)
    .single();

  if (char) {
    await supabase
      .from('characters')
      .update({
        coins: (char.coins ?? 0) + coins,
        diamonds: (char.diamonds ?? 0) + diamonds
      })
      .eq('id', characterId);
  }

  // Adicionar itens ao inventário via RPC
  for (const drop of items) {
    await supabase.rpc('add_item_to_inventory', {
      p_character_id: characterId,
      p_item_id: drop.itemId,
      p_quantity: drop.quantity
    });
  }

  return { xp, coins, diamonds, items };
}
