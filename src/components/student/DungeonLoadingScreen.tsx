import { useEffect, useState } from "react";
import { AincradBackground } from "@/components/ui/AincradBackground";

const LORE_TIPS = [
  "As masmorras de WIT guardam segredos ancestrais de inteligência artificial",
  "Cada desafio completado fortalece sua mente e expande seus horizontes",
  "Os guerreiros mais sábios aprendem com cada derrota e cada vitória",
  "A inteligência artificial não substitui o herói — ela é sua arma mais poderosa",
  "Conhecimento é o tesouro mais valioso de Aincrad",
  "Sua jornada começa com um único passo em direção ao desconhecido",
  "Os melhores estrategistas compreendem tanto a magia quanto a lógica",
];

export function DungeonLoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipVisible, setTipVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + Math.random() * 8 + 2;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex(i => (i + 1) % LORE_TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <AincradBackground scene="login" />
      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
        <div className="relative">
          <svg viewBox="0 0 100 100" className="w-24 h-24 animate-spin-slow">
            <polygon
              points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
              fill="none"
              stroke="hsl(187 100% 50%)"
              strokeWidth="1.5"
              className="animate-glow-breathe"
            />
            <polygon
              points="50,20 78,35 78,65 50,80 22,65 22,35"
              fill="rgba(0,229,255,0.05)"
              stroke="rgba(0,229,255,0.3)"
              strokeWidth="0.5"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-glow-breathe" style={{ boxShadow: '0 0 12px #00e5ff' }} />
          </div>
        </div>
        <p className="text-cyan-400 font-bold tracking-[4px] uppercase text-sm text-glow-cyan" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Conectando à Dungeon
        </p>
        <div className="w-64">
          <div className="cyber-progress">
            <div className="cyber-progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p className="text-xs text-white/30 mt-1 text-right font-mono">{Math.round(progress)}%</p>
        </div>
        <p className="text-white/40 text-xs max-w-xs leading-relaxed transition-opacity duration-400" style={{ opacity: tipVisible ? 1 : 0 }}>
          {LORE_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}
