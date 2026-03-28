import { InventoryScreen } from '@/components/inventory/InventoryScreen';

interface BattleInventoryViewProps {
  characterId: string;
}

export function BattleInventoryView({ characterId }: BattleInventoryViewProps) {
  return (
    <InventoryScreen
      characterId={characterId}
      onClose={() => {}}
    />
  );
}
