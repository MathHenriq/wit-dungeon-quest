import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InventoryItem {
  item_id: string;
  quantity: number;
  items: {
    id: string;
    name: string;
    description: string;
    type: string;
    rarity: string;
    icon_url: string | null;
  };
}

interface InventoryScreenProps {
  characterId: string;
  onClose: () => void;
  onUseItem?: (itemId: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common:    'text-gray-500',
  uncommon:  'text-green-600',
  rare:      'text-blue-600',
  epic:      'text-purple-600',
  legendary: 'text-yellow-500'
};

const RARITY_BORDER: Record<string, string> = {
  common:    'border-gray-200',
  uncommon:  'border-green-300',
  rare:      'border-blue-300',
  epic:      'border-purple-400',
  legendary: 'border-yellow-400'
};

const TYPE_ICON: Record<string, string> = {
  potion_hp:     '🧪',
  potion_energy: '⚡',
  revive:        '💫',
  buff:          '🔮',
  material:      '🪨'
};

function ItemCard({
  entry,
  onUseItem
}: {
  entry: InventoryItem;
  onUseItem?: (itemId: string) => void;
}) {
  const item = entry.items;
  const border = RARITY_BORDER[item.rarity] ?? 'border-gray-200';
  const color = RARITY_COLORS[item.rarity] ?? 'text-gray-600';
  const icon = TYPE_ICON[item.type] ?? '📦';

  return (
    <div className={`border-2 ${border} rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow`}>
      <div className="text-4xl">
        {item.icon_url ? (
          <img src={item.icon_url} alt={item.name} className="w-12 h-12 object-contain" />
        ) : (
          icon
        )}
      </div>

      <h3 className={`font-bold text-sm text-center ${color}`}>{item.name}</h3>
      <p className="text-xs text-gray-500 text-center leading-tight">{item.description}</p>

      <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-gray-100 ${color}`}>
        {item.rarity}
      </span>

      <div className="text-lg font-black text-gray-700">×{entry.quantity}</div>

      {onUseItem && (
        <button
          onClick={() => onUseItem(entry.item_id)}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold py-2 rounded-lg transition-all"
        >
          USAR
        </button>
      )}
    </div>
  );
}

const TYPE_ORDER = ['potion_hp', 'potion_energy', 'revive', 'buff', 'material'];

export function InventoryScreen({ characterId, onClose, onUseItem }: InventoryScreenProps) {
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', characterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_inventory')
        .select(`
          item_id, quantity,
          items:item_id ( id, name, description, type, rarity, icon_url )
        `)
        .eq('character_id', characterId)
        .gt('quantity', 0);

      if (error) throw error;
      return (data ?? []) as InventoryItem[];
    }
  });

  const sorted = [...inventory].sort(
    (a, b) => TYPE_ORDER.indexOf(a.items.type) - TYPE_ORDER.indexOf(b.items.type)
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-2xl font-black text-gray-800">🎒 Inventário</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <span className="animate-spin text-3xl mr-3">⏳</span>
              Carregando inventário...
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-lg font-semibold">Inventário vazio</p>
              <p className="text-sm mt-1">Derrote inimigos para conseguir itens!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sorted.map((entry) => (
                <ItemCard key={entry.item_id} entry={entry} onUseItem={onUseItem} />
              ))}
            </div>
          )}
        </div>

        {/* Footer com contagem */}
        {!isLoading && sorted.length > 0 && (
          <div className="border-t p-3 text-center text-xs text-gray-400">
            {sorted.length} tipo{sorted.length !== 1 ? 's' : ''} de item · {sorted.reduce((a, e) => a + e.quantity, 0)} total
          </div>
        )}

      </div>
    </div>
  );
}
