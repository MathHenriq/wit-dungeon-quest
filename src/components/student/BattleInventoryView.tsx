import { useState } from 'react';
import { InventoryScreen } from '@/components/inventory/InventoryScreen';

interface BattleInventoryViewProps {
  characterId: string;
}

export function BattleInventoryView({ characterId }: BattleInventoryViewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
      >
        🎒 Abrir Inventário de Batalha
      </button>

      {open && (
        <InventoryScreen
          characterId={characterId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
