import { useState } from 'react';

interface TutorialStep {
  title: string;
  description: string;
  emoji: string;
}

const STEPS: TutorialStep[] = [
  {
    emoji: '🏰',
    title: 'Bem-vindo ao WIT Dungeon!',
    description: 'Um RPG de batalha por turnos onde você cresce junto com seu personagem. Vamos aprender o básico!'
  },
  {
    emoji: '⚗️',
    title: 'Pontos Elementais',
    description: 'A cada level você ganha 3 pontos para distribuir entre 12 elementos (Fogo, Água, Elétrico…). Cada elemento desbloqueia habilidades únicas!'
  },
  {
    emoji: '⚔️',
    title: 'Habilidades',
    description: 'Conforme acumula pontos em um elemento, novas habilidades são desbloqueadas em Tiers 1→4. Equipe até 4 habilidades para usar em batalha.'
  },
  {
    emoji: '🎮',
    title: 'Batalhas por Turno',
    description: 'Cada ação gasta energia. Energia regenera +5 por turno. Escolha bem suas habilidades — algumas causam efeitos de status!'
  },
  {
    emoji: '🔄',
    title: 'Sistema de Tipos',
    description: 'Fire é forte contra Grass, Water contra Fire, Electric contra Water… Explore as fraquezas do inimigo para causar 2× de dano!'
  },
  {
    emoji: '🗺️',
    title: 'Andares do Dungeon',
    description: 'Cada andar tem 5 inimigos + 1 Boss. Derrotar todos abre o próximo andar e rende XP, moedas, diamantes e itens!'
  },
  {
    emoji: '⚔️',
    title: 'Arena PvP',
    description: 'Desafie outros jogadores na Arena! O sistema de rating ELO garante que você sempre enfrente oponentes de nível similar.'
  },
  {
    emoji: '🚀',
    title: 'Pronto para começar!',
    description: 'Distribua seus pontos, equipe suas habilidades favoritas e conquiste os andares. Boa sorte, Guardião!'
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [current, setCurrent] = useState(0);
  const step = STEPS[current];
  const isLast = current === STEPS.length - 1;
  const progress = ((current + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onComplete}
      />

      {/* Card */}
      <div className="relative bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl aaa-entrance">

        {/* Emoji grande */}
        <div className="text-6xl text-center mb-4 animate-slow-drift">
          {step.emoji}
        </div>

        {/* Contador */}
        <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
          <span>Tutorial</span>
          <span>{current + 1} / {STEPS.length}</span>
        </div>

        {/* Barra de progresso */}
        <div className="w-full h-1 bg-gray-700 rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Conteúdo */}
        <h3 className="text-xl font-black text-white mb-2 text-glow-cyan">{step.title}</h3>
        <p className="text-gray-300 text-sm leading-relaxed min-h-[60px]">{step.description}</p>

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onComplete}
            className="flex-1 py-2.5 rounded-lg text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 text-sm font-semibold transition-all"
          >
            Pular
          </button>
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setCurrent(c => c + 1);
              }
            }}
            className="flex-2 flex-grow-[2] btn-cyber py-2.5 justify-center font-black"
          >
            {isLast ? '🚀 Começar!' : 'Próximo →'}
          </button>
        </div>

        {/* Dots de navegação */}
        <div className="flex justify-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current
                  ? 'bg-cyan-400 w-4'
                  : i < current
                  ? 'bg-cyan-800'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
