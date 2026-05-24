// ============================================================
// Onda 11.4 — Card reutilizável de classe.
// Usado na ClassSelectionScreen e poderá ser reaproveitado em
// telas de perfil, ranking, etc.
// ============================================================

import type { FC, MouseEventHandler } from 'react';
import type { ClassType } from '@/lib/skills/skillsRegistry';
import {
  CLASS_ATTRIBUTES,
  CLASS_ELEMENT_AFFINITY,
} from '@/lib/skills/skillsRegistry';
import { CLASS_ICONS, CLASS_META } from '@/lib/skills/classIcons';
import { ELEMENT_ICONS, ELEMENT_META_PT } from '@/lib/skills/elementIcons';

const ATTR_LABELS_PT: Record<string, string> = {
  forca:        'Força',
  destreza:     'Destreza',
  inteligencia: 'Inteligência',
  carisma:      'Carisma',
  agilidade:    'Agilidade',
  resistencia:  'Resistência',
};

export interface CardClassPreviewProps {
  classType:  ClassType;
  selected?:  boolean;
  expanded?:  boolean;       // mostra elementos de afinidade
  onClick?:   MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
  /** Quando setada, fixa estilo desabilitado (somente leitura). */
  readonly?: boolean;
}

export const CardClassPreview: FC<CardClassPreviewProps> = ({
  classType, selected = false, expanded = false,
  onClick, onMouseEnter, onMouseLeave, readonly = false,
}) => {
  const meta  = CLASS_META[classType];
  const attrs = CLASS_ATTRIBUTES[classType];
  const aff   = CLASS_ELEMENT_AFFINITY[classType];
  const Icon  = CLASS_ICONS[classType];

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={readonly}
      data-selected={selected}
      className={[
        'group relative w-full text-left rounded-xl p-5 transition-all duration-300',
        'border backdrop-blur-xl outline-none',
        selected
          ? 'scale-[1.02] border-white/40 shadow-[0_0_40px_-5px_var(--glow)]'
          : 'border-white/10 hover:border-white/25 hover:scale-[1.01]',
        readonly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      style={{
        background: selected
          ? `linear-gradient(135deg, ${meta.color}22, rgba(255,255,255,0.04))`
          : 'rgba(255,255,255,0.04)',
        // CSS var consumida pelo shadow do estado selected
        ['--glow' as any]: meta.color,
      }}
      aria-pressed={selected}
    >
      {/* Glow ring quando selecionado */}
      {selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ boxShadow: `inset 0 0 0 1px ${meta.color}AA` }}
        />
      )}

      <div className="flex items-start gap-4">
        <div
          className="shrink-0 rounded-lg p-2"
          style={{ color: meta.color, background: `${meta.color}1A` }}
        >
          <Icon size={40} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-orbitron text-lg tracking-wide uppercase truncate"
            style={{ color: meta.color }}
          >
            {meta.label}
          </h3>
          <p className="mt-1 text-xs text-white/55 whitespace-pre-line leading-snug font-rajdhani">
            {meta.playStyle}
          </p>
        </div>
      </div>

      {/* Atributos */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] font-rajdhani uppercase tracking-wider">
        <AttrPill label="1º" attr={ATTR_LABELS_PT[attrs.primary]}   accent={meta.color} strong />
        <AttrPill label="2º" attr={ATTR_LABELS_PT[attrs.secondary]} accent={meta.color} />
        <AttrPill label="3º" attr={ATTR_LABELS_PT[attrs.tertiary]}  accent={meta.color} />
      </div>

      {/* Afinidades elementais (expanded) — pílulas compactas, cabem numa linha */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-rajdhani">
            Afinidades elementais
          </p>
          <div className="flex items-center gap-2">
            {aff.affinities.map(el => {
              const ElIcon = ELEMENT_ICONS[el];
              const isPrimary = el === aff.primary;
              const elMeta = ELEMENT_META_PT[el];
              return (
                <span
                  key={el}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 min-w-0"
                  style={{
                    color: isPrimary ? elMeta.color : '#ffffffb0',
                    background: `${elMeta.color}14`,
                    border: `1px solid ${elMeta.color}${isPrimary ? '55' : '22'}`,
                    boxShadow: isPrimary ? `0 0 10px ${elMeta.color}55` : undefined,
                  }}
                  title={`${elMeta.label}${isPrimary ? ' (principal)' : ''}`}
                >
                  <ElIcon size={14} />
                  <span className="text-[10px] font-rajdhani uppercase tracking-wide truncate">
                    {elMeta.label}
                  </span>
                  {isPrimary && <span className="text-[9px] opacity-90">★</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
};

// ─── Subcomponente: pílula de atributo ──────────────────────────────────────

const AttrPill: FC<{ label: string; attr: string; accent: string; strong?: boolean }> = ({
  label, attr, accent, strong,
}) => (
  <div
    className={[
      'rounded-md px-2 py-1.5 border text-center truncate',
      strong ? 'font-bold' : 'opacity-75',
    ].join(' ')}
    style={{
      color:        strong ? accent : '#ffffffcc',
      borderColor:  strong ? `${accent}55` : 'rgba(255,255,255,0.08)',
      background:   strong ? `${accent}14` : 'rgba(255,255,255,0.02)',
    }}
  >
    <span className="opacity-50 mr-1">{label}</span>
    {attr}
  </div>
);
