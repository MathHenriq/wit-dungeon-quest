// AttributePanel — Patch 2.1
//
// Shows the 6 base attributes with their CURRENT in-battle effect, so
// students see what every point actually does.  Pure view — no state, no
// fetching: feed it the attributes you already loaded (e.g. from
// useBattleCharacter, or from the student row, or from a PvP opponent).
//
// Visual: glassmorphism dark panel matching the rest of the app
// (Orbitron/Rajdhani fonts, uppercase labels, cyan + class-color accents).

import { describeAttributeEffects, type AttributeBundle } from '@/lib/battle/attributeModifiers';
import { GameIcon } from '@/components/icons/GameIcon';

const ATTR_ICON: Record<keyof AttributeBundle, string> = {
  forca:        'sword',
  destreza:     'bow',
  inteligencia: 'wand',
  carisma:      'heart',
  agilidade:    'star',
  resistencia:  'shield',
};

interface Props {
  attributes: Partial<AttributeBundle> | null | undefined;
  /** Optional compact mode — single column, smaller padding. */
  compact?: boolean;
  /** Optional title; pass null to hide. */
  title?: string | null;
}

export function AttributePanel({ attributes, compact = false, title = 'ATRIBUTOS' }: Props) {
  const rows = describeAttributeEffects(attributes);

  return (
    <div
      style={{
        background: 'rgba(4,6,10,0.72)',
        border:     '1px solid rgba(56,217,232,0.18)',
        borderRadius: 12,
        padding: compact ? '12px 14px' : '16px 18px',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 0 24px rgba(56,217,232,0.05), 0 8px 28px rgba(0,0,0,0.5)',
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10, letterSpacing: '3px',
            color: 'rgba(56,217,232,0.55)',
            marginBottom: compact ? 8 : 12,
            textAlign: 'left',
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: compact ? 6 : 10,
        }}
      >
        {rows.map(r => (
          <div
            key={r.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${r.color}24`,
              borderRadius: 8,
              transition: 'border-color .15s',
            }}
          >
            <div
              style={{
                width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                background: `${r.color}14`, border: `1px solid ${r.color}3c`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <GameIcon id={ATTR_ICON[r.key]} size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6,
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 12, fontWeight: 600,
                  color: r.color, letterSpacing: '1.4px', textTransform: 'uppercase',
                }}
              >
                <span>{r.label}</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 13, fontWeight: 800,
                    color: '#e2e8f0',
                  }}
                >
                  {r.value}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 10, letterSpacing: '0.5px',
                  color: r.capped ? '#fbbf24' : 'rgba(200,216,240,0.65)',
                  marginTop: 2,
                }}
                title={r.capped ? 'Limite máximo atingido' : undefined}
              >
                {r.value === 0
                  ? <span style={{ opacity: 0.4 }}>sem efeito</span>
                  : <>{r.effect}{r.capped && ' (max)'}</>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
