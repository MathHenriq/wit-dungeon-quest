import { Coins, Lock, CheckCircle, ShoppingBag } from "lucide-react";
import { ShopItem } from "@/types/game";

interface ShopItemCardProps {
  item: ShopItem;
  playerLevel: number;
  playerCoins: number;
  isRequested: boolean;
  onRequest: () => void;
}

export function ShopItemCard({
  item,
  playerLevel,
  playerCoins,
  isRequested,
  onRequest,
}: ShopItemCardProps) {
  const canAfford = playerCoins >= item.cost;
  const meetsLevel = playerLevel >= item.minLevel;
  const canPurchase = canAfford && meetsLevel && !isRequested;

  const typeColors = {
    weapon: "bg-destructive/10 text-destructive",
    armor: "bg-primary/10 text-primary",
    ability: "bg-success/10 text-success",
  };

  const typeLabels = {
    weapon: "Arma",
    armor: "Armadura",
    ability: "Habilidade",
  };

  return (
    <div className="card-fantasy flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-4xl`}>{item.icon}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeColors[item.type]}`}>
          {typeLabels[item.type]}
        </span>
      </div>

      <h3 className="font-display font-bold text-lg mb-1">{item.name}</h3>
      <p className="text-muted-foreground text-sm mb-4 flex-1">{item.description}</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gold-dark font-semibold">
            <Coins size={16} />
            <span>{item.cost}</span>
          </div>
          <div className={`flex items-center gap-1 ${meetsLevel ? "text-muted-foreground" : "text-destructive"}`}>
            {!meetsLevel && <Lock size={14} />}
            <span>Nível {item.minLevel}</span>
          </div>
        </div>

        {isRequested ? (
          <button
            disabled
            className="btn-fantasy w-full opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Solicitado
          </button>
        ) : !meetsLevel ? (
          <button
            disabled
            className="btn-fantasy w-full opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            Nível insuficiente
          </button>
        ) : !canAfford ? (
          <button
            disabled
            className="btn-fantasy w-full opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Coins size={16} />
            Moedas insuficientes
          </button>
        ) : (
          <button
            onClick={onRequest}
            className="btn-fantasy w-full flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Solicitar item
          </button>
        )}
      </div>
    </div>
  );
}
