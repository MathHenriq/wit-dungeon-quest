import { useState } from "react";
import { Student } from "@/types/game";
import { weekChallenges } from "@/data/challenges";
import { shopItems } from "@/data/shopItems";
import { PlayerHeader } from "./PlayerHeader";
import { ChallengeCard } from "./ChallengeCard";
import { ShopItemCard } from "./ShopItemCard";
import { LevelBadge } from "./LevelBadge";
import { Sword, ShoppingBag, Scroll, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface DashboardProps {
  student: Student;
  onLogout: () => void;
  onRequestChallenge: (challengeId: string, challengeTitle: string) => void;
  onRequestItem: (itemId: string, itemName: string) => void;
  hasChallengeRequest: (challengeId: string) => boolean;
  hasItemRequest: (itemId: string) => boolean;
}

export function Dashboard({
  student,
  onLogout,
  onRequestChallenge,
  onRequestItem,
  hasChallengeRequest,
  hasItemRequest,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"challenges" | "shop">("challenges");

  const handleChallengeRequest = (challengeId: string, challengeTitle: string) => {
    onRequestChallenge(challengeId, challengeTitle);
    toast.success("Desafio solicitado!", {
      description: "Aguarde a validação do professor.",
      icon: "⚔️",
    });
  };

  const handleItemRequest = (itemId: string, itemName: string) => {
    onRequestItem(itemId, itemName);
    toast.success("Item solicitado!", {
      description: "Aguarde a aprovação do professor.",
      icon: "🛡️",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PlayerHeader student={student} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Banner */}
        <div className="card-fantasy mb-6 bg-gradient-to-r from-dungeon-dark to-primary text-primary-foreground overflow-hidden relative">
          <div className="absolute right-0 top-0 w-32 h-32 bg-gold/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute right-8 bottom-0 w-20 h-20 bg-gold/5 rounded-full -mb-10" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <LevelBadge level={student.level} />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
                <Sparkles className="text-gold" size={24} />
                Bem-vindo, {student.characterName || student.name}!
              </h2>
              <p className="text-primary-foreground/80 mt-1">
                Complete desafios e conquiste recompensas épicas!
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Level Display */}
        <div className="md:hidden card-fantasy mb-4 flex items-center justify-center gap-3">
          <span className="text-muted-foreground">Seu Nível:</span>
          <LevelBadge level={student.level} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("challenges")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "challenges"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Sword size={20} />
            <span>Desafios</span>
          </button>
          <button
            onClick={() => setActiveTab("shop")}
            className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === "shop"
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            <ShoppingBag size={20} />
            <span>Loja</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === "challenges" ? (
          <section>
            <div className="section-title">
              <Scroll className="text-gold" />
              <span>Desafios da Semana</span>
            </div>
            <div className="grid gap-4">
              {weekChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isRequested={hasChallengeRequest(challenge.id)}
                  onRequest={() => handleChallengeRequest(challenge.id, challenge.title)}
                />
              ))}
            </div>
          </section>
        ) : (
          <section>
            <div className="section-title">
              <ShoppingBag className="text-gold" />
              <span>Loja de Recompensas</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shopItems.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  playerLevel={student.level}
                  playerCoins={student.coins}
                  isRequested={hasItemRequest(item.id)}
                  onRequest={() => handleItemRequest(item.id, item.name)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>⚠️ Todas as solicitações são validadas pelo professor</p>
          <p>As moedas não são alteradas automaticamente</p>
        </div>
      </main>
    </div>
  );
}
