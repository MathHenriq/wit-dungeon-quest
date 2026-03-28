import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BattleCharacter, ElementType } from '@/types/character';
import { ELEMENT_META, getElementPoints } from '@/types/character';

interface PointDistributorProps {
  character: BattleCharacter;
  onDistribute: (element: ElementType, amount: number) => void;
  isLoading?: boolean;
}

export function PointDistributor({ character, onDistribute, isLoading }: PointDistributorProps) {
  const [pending, setPending] = useState<Partial<Record<ElementType, number>>>({});
  const totalPending = Object.values(pending).reduce((s, v) => s + (v ?? 0), 0);
  const remaining = character.freePoints - totalPending;

  function add(element: ElementType) {
    if (remaining <= 0) return;
    setPending(p => ({ ...p, [element]: (p[element] ?? 0) + 1 }));
  }

  function sub(element: ElementType) {
    const cur = pending[element] ?? 0;
    if (cur <= 0) return;
    setPending(p => ({ ...p, [element]: cur - 1 }));
  }

  function confirm() {
    Object.entries(pending).forEach(([el, amount]) => {
      if (amount && amount > 0) onDistribute(el as ElementType, amount);
    });
    setPending({});
  }

  function reset() {
    setPending({});
  }

  if (character.freePoints === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(0,0,0,0.6))',
        border: '1px solid rgba(250,204,21,0.25)',
        boxShadow: '0 0 24px rgba(250,204,21,0.1)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-yellow-400" />
          <span className="font-bold text-yellow-300 text-sm">Distribuir Pontos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Disponíveis:</span>
          <span
            className={cn(
              'font-bold text-sm px-2 py-0.5 rounded-full',
              remaining > 0 ? 'text-yellow-300 bg-yellow-400/10' : 'text-white/30',
            )}
          >
            {remaining}
          </span>
        </div>
      </div>

      {/* Element sliders */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
        {(Object.keys(ELEMENT_META) as ElementType[]).map(element => {
          const meta        = ELEMENT_META[element];
          const current     = getElementPoints(character, element);
          const adding      = pending[element] ?? 0;

          return (
            <div
              key={element}
              className="rounded-xl p-2.5"
              style={{
                background: adding > 0 ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${adding > 0 ? meta.color + '40' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base leading-none">{meta.icon}</span>
                <span className="text-[11px] font-medium text-white/80 truncate">{element}</span>
              </div>

              <div className="flex items-center gap-1 justify-between">
                <button
                  onClick={() => sub(element)}
                  disabled={!adding}
                  className={cn(
                    'w-5 h-5 rounded flex items-center justify-center transition-colors text-xs',
                    adding > 0
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-white/5 text-white/20 cursor-not-allowed',
                  )}
                >
                  <Minus size={10} />
                </button>

                <div className="text-center">
                  <div className="text-[11px] font-bold text-white">
                    {current}
                    {adding > 0 && (
                      <span style={{ color: meta.color }}> +{adding}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => add(element)}
                  disabled={remaining <= 0}
                  className={cn(
                    'w-5 h-5 rounded flex items-center justify-center transition-colors text-xs',
                    remaining > 0
                      ? 'hover:bg-white/20 text-white'
                      : 'text-white/20 cursor-not-allowed',
                  )}
                  style={{
                    background: remaining > 0 ? `${meta.color}30` : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Plus size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {totalPending > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2"
        >
          <button
            onClick={reset}
            className="flex-1 text-xs py-2 rounded-lg text-white/50 hover:text-white/80 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={isLoading}
            className="flex-1 text-xs py-2 rounded-lg font-bold text-black transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {isLoading ? 'Salvando...' : `Confirmar (+${totalPending} pts)`}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
