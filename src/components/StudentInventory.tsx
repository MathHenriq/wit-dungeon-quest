import { ShoppingBag, Package } from "lucide-react";

interface InventoryItem {
  id: string;
  item: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    image_url: string | null;
    item_type: string;
  };
}

interface StudentInventoryProps {
  inventory: InventoryItem[];
}

const typeColors: Record<string, string> = {
  weapon: "bg-destructive/10 text-destructive",
  armor: "bg-primary/10 text-primary",
  ability: "bg-success/10 text-success",
};

const typeLabels: Record<string, string> = {
  weapon: "Arma",
  armor: "Armadura",
  ability: "Habilidade",
};

export function StudentInventory({ inventory }: StudentInventoryProps) {
  if (inventory.length === 0) {
    return (
      <div className="card-fantasy text-center py-12">
        <Package size={64} className="mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="font-display text-xl font-bold text-muted-foreground mb-2">
          Seu inventário ainda está vazio
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete desafios e solicite itens na loja para preencher seu inventário!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="section-title">
        <ShoppingBag className="text-gold" />
        <span>Meu Inventário</span>
        <span className="text-sm font-normal text-muted-foreground ml-2">
          ({inventory.length} {inventory.length === 1 ? 'item' : 'itens'})
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((inv) => (
          <div key={inv.id} className="card-fantasy flex flex-col h-full overflow-hidden">
            {/* Item Image/Icon Header */}
            <div className="relative -mx-5 -mt-5 mb-4 aspect-video bg-gradient-to-b from-dungeon-dark/30 to-dungeon-dark/10 flex items-center justify-center">
              {inv.item.image_url ? (
                <img
                  src={inv.item.image_url}
                  alt={inv.item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.item-icon-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`item-icon-fallback absolute inset-0 flex items-center justify-center ${inv.item.image_url ? 'hidden' : ''}`}>
                <span className="text-7xl drop-shadow-lg">{inv.item.icon}</span>
              </div>
              <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full ${typeColors[inv.item.item_type] || typeColors.weapon}`}>
                {typeLabels[inv.item.item_type] || "Item"}
              </span>
            </div>

            <h3 className="font-display font-bold text-lg mb-1">{inv.item.name}</h3>
            {inv.item.description && (
              <p className="text-muted-foreground text-sm flex-1">{inv.item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
