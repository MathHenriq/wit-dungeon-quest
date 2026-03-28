import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BattleLogEntry } from '@/lib/battle';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BattleLogProps {
  entries:  BattleLogEntry[];
  /** How many recent lines to show; defaults to 5 */
  maxLines?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entryColor(entry: BattleLogEntry): string {
  if (entry.type === 'damage' && entry.actor === 'player')  return '#4ade80';  // green — player deals dmg
  if (entry.type === 'damage' && entry.actor === 'enemy')   return '#f87171';  // red — player takes dmg
  if (entry.type === 'status')                               return '#fbbf24';  // yellow — status
  if (entry.type === 'effect')                               return '#a78bfa';  // purple — effect
  if (entry.actor === 'system')                              return '#67e8f9';  // cyan — system
  return '#94a3b8'; // muted default
}

function actorLabel(entry: BattleLogEntry): string {
  if (entry.actor === 'player') return '▶';
  if (entry.actor === 'enemy')  return '◀';
  return '•';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BattleLog({ entries, maxLines = 5 }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever entries change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  const visible = entries.slice(-maxLines);

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(0,229,255,0.12)',
        borderRadius: 8,
        padding: '8px 10px',
        minHeight: 80,
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '0.62rem',
          color: 'rgba(0,229,255,0.5)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 6,
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700,
        }}
      >
        ── Log de Batalha ──
      </div>

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 120,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <AnimatePresence initial={false}>
          {visible.map((entry, i) => (
            <motion.div
              key={`${entry.turn}-${i}-${entry.message}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
                fontSize: '0.75rem',
                lineHeight: 1.4,
              }}
            >
              {/* Actor icon */}
              <span
                style={{
                  color: entryColor(entry),
                  flexShrink: 0,
                  marginTop: 1,
                  fontSize: '0.65rem',
                }}
              >
                {actorLabel(entry)}
              </span>

              {/* Message */}
              <span style={{ color: entryColor(entry) }}>
                {entry.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
            A batalha ainda não começou...
          </span>
        )}
      </div>
    </div>
  );
}
