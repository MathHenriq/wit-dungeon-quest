import { Coins, CheckCircle, Sword, Clock } from "lucide-react";
import { Challenge } from "@/types/game";

interface ChallengeCardProps {
  challenge: Challenge;
  isRequested: boolean;
  onRequest: () => void;
}

export function ChallengeCard({ challenge, isRequested, onRequest }: ChallengeCardProps) {
  return (
    <div className="card-fantasy relative overflow-hidden">
      {isRequested && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 text-success text-sm font-semibold bg-success/10 px-2 py-1 rounded-full">
            <Clock size={14} />
            <span>Aguardando</span>
          </div>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sword className="text-primary" size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-foreground mb-1">
            {challenge.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-3">
            {challenge.description}
          </p>
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-gold-dark font-semibold">
              <Coins size={16} />
              <span>+{challenge.reward}</span>
            </div>
            
            {isRequested ? (
              <button
                disabled
                className="btn-fantasy opacity-60 cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Solicitado
              </button>
            ) : (
              <button
                onClick={onRequest}
                className="btn-fantasy flex items-center gap-2"
              >
                Concluir desafio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
