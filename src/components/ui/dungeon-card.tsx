/**
 * DungeonCard — Componente de referência do Design System v2
 *
 * Demonstra o uso dos tokens de:
 *   - cores (bg, border, text, rewards)
 *   - tipografia (ds-display, ds-sans)
 *   - sombras/glows
 *   - glassmorphism
 *   - animações
 *
 * USO:
 *   <DungeonCard
 *     title="Missão: Caverna do Caos"
 *     description="Resolva 5 equações de segundo grau antes do tempo acabar."
 *     rarity="epic"
 *     xpReward={250}
 *     coinsReward={40}
 *     progress={60}
 *     onAccept={() => console.log('aceito')}
 *   />
 */

import React from 'react';
import { Zap, Coins, ChevronRight, Star, Shield, Swords } from 'lucide-react';
import { colors, shadows, animations } from '@/styles/design-tokens';

// ── Tipos ────────────────────────────────────────────────────────────────────

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

interface DungeonCardProps {
  title: string;
  description: string;
  rarity?: Rarity;
  xpReward?: number;
  coinsReward?: number;
  diamondsReward?: number;
  /** 0–100 */
  progress?: number;
  /** Ícone de categoria — 'quest' | 'boss' | 'daily' */
  type?: 'quest' | 'boss' | 'daily';
  onAccept?: () => void;
  className?: string;
}

// ── Config de raridade ────────────────────────────────────────────────────────

const rarityConfig: Record<Rarity, {
  label: string;
  borderColor: string;
  glowColor: string;
  badgeBg: string;
  badgeText: string;
  shimmerColor: string;
}> = {
  common: {
    label: 'Comum',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    glowColor:   'rgba(148, 163, 184, 0.12)',
    badgeBg:     'rgba(148, 163, 184, 0.1)',
    badgeText:   '#94a3b8',
    shimmerColor: '#94a3b8',
  },
  rare: {
    label: 'Raro',
    borderColor: 'rgba(96, 165, 250, 0.35)',
    glowColor:   'rgba(96, 165, 250, 0.15)',
    badgeBg:     'rgba(96, 165, 250, 0.1)',
    badgeText:   colors.rewards.diamonds,
    shimmerColor: colors.rewards.diamonds,
  },
  epic: {
    label: 'Épico',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    glowColor:   'rgba(34, 197, 94, 0.15)',
    badgeBg:     'rgba(34, 197, 94, 0.08)',
    badgeText:   colors.text.accent,
    shimmerColor: colors.text.accent,
  },
  legendary: {
    label: 'Lendário',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    glowColor:   'rgba(234, 179, 8, 0.2)',
    badgeBg:     'rgba(234, 179, 8, 0.1)',
    badgeText:   colors.rewards.coins,
    shimmerColor: colors.rewards.coins,
  },
};

const typeConfig = {
  quest: { icon: Swords,  label: 'MISSÃO' },
  boss:  { icon: Shield,  label: 'BOSS'   },
  daily: { icon: Star,    label: 'DIÁRIO' },
};

// ── Componente ────────────────────────────────────────────────────────────────

export function DungeonCard({
  title,
  description,
  rarity = 'common',
  xpReward,
  coinsReward,
  diamondsReward,
  progress,
  type = 'quest',
  onAccept,
  className = '',
}: DungeonCardProps) {
  const r = rarityConfig[rarity];
  const t = typeConfig[type];
  const TypeIcon = t.icon;

  return (
    <div
      className={`dungeon-card ${className}`}
      style={{
        // ── Glassmorphism com tokens ──────────────────────────────
        background: `linear-gradient(135deg, ${colors.bg.secondary}, ${colors.bg.tertiary})`,
        border:     `1px solid ${r.borderColor}`,
        borderRadius: '1rem',
        backdropFilter: 'blur(12px)',
        boxShadow: `
          ${shadows.lg},
          0 0 0 1px rgba(255,255,255,0.04) inset,
          0 0 30px ${r.glowColor}
        `,
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        transition: `all ${animations.transition.slow}`,
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `
          ${shadows.xl},
          0 0 0 1px rgba(255,255,255,0.06) inset,
          0 0 50px ${r.glowColor}
        `;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `
          ${shadows.lg},
          0 0 0 1px rgba(255,255,255,0.04) inset,
          0 0 30px ${r.glowColor}
        `;
      }}
    >
      {/* ── Shimmer line superior ───────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${r.shimmerColor}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        {/* Tipo de card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: r.badgeBg,
              border: `1px solid ${r.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TypeIcon size={14} style={{ color: r.badgeText }} />
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: colors.text.secondary,
              textTransform: 'uppercase',
            }}
          >
            {t.label}
          </span>
        </div>

        {/* Badge de raridade */}
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: r.badgeText,
            background: r.badgeBg,
            border: `1px solid ${r.borderColor}`,
            borderRadius: '9999px',
            padding: '0.2rem 0.6rem',
          }}
        >
          {r.label}
        </span>
      </div>

      {/* ── Título ──────────────────────────────────────────────── */}
      <h3
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem',
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '0.5rem',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>

      {/* ── Descrição ───────────────────────────────────────────── */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.875rem',
          color: colors.text.secondary,
          lineHeight: 1.6,
          marginBottom: '1.25rem',
        }}
      >
        {description}
      </p>

      {/* ── Barra de progresso (opcional) ───────────────────────── */}
      {progress !== undefined && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem', color: colors.text.muted }}>
              Progresso
            </span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: colors.text.accent }}>
              {progress}%
            </span>
          </div>
          <div
            style={{
              height: '4px',
              borderRadius: '9999px',
              background: `hsl(${240} ${3.7}% ${15.9}%)`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: '9999px',
                background: `linear-gradient(90deg, ${colors.text.accent}, ${colors.rewards.diamonds})`,
                boxShadow: shadows.glow.green,
                transition: `width ${animations.transition.slow}`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Footer: recompensas + botão ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        {/* Recompensas */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {xpReward && (
            <RewardBadge
              icon={<Zap size={11} />}
              value={`+${xpReward} XP`}
              color={colors.rewards.xp}
            />
          )}
          {coinsReward && (
            <RewardBadge
              icon={<span style={{ fontSize: '10px' }}>◎</span>}
              value={`${coinsReward}`}
              color={colors.rewards.coins}
            />
          )}
          {diamondsReward && (
            <RewardBadge
              icon={<span style={{ fontSize: '10px' }}>◆</span>}
              value={`${diamondsReward}`}
              color={colors.rewards.diamonds}
            />
          )}
        </div>

        {/* Botão aceitar */}
        {onAccept && (
          <button
            onClick={onAccept}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: r.badgeText,
              background: r.badgeBg,
              border: `1px solid ${r.borderColor}`,
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              transition: `all ${animations.transition.base}`,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = r.glowColor;
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${r.glowColor}`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = r.badgeBg;
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            Aceitar
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Subcomponente: badge de recompensa ────────────────────────────────────────

function RewardBadge({ icon, value, color }: { icon: React.ReactNode; value: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '0.75rem',
        fontWeight: 600,
        color,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        borderRadius: '9999px',
        padding: '0.2rem 0.6rem',
      }}
    >
      {icon}
      {value}
    </span>
  );
}

// ── Showcase (uso em dev/Storybook) ───────────────────────────────────────────

export function DungeonCardShowcase() {
  return (
    <div
      style={{
        background: colors.bg.primary,
        minHeight: '100vh',
        padding: '3rem 2rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          color: colors.text.primary,
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        Design System v2 — DungeonCard
      </h1>
      <p
        style={{
          fontSize: '0.875rem',
          color: colors.text.secondary,
          marginBottom: '2.5rem',
        }}
      >
        Componente de referência · raridades: common · rare · epic · legendary
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
        }}
      >
        <DungeonCard
          title="Patrulha do Corredor"
          description="Complete 3 exercícios de gramática para desbloquear o próximo andar."
          rarity="common"
          xpReward={80}
          coinsReward={15}
          progress={33}
          type="daily"
          onAccept={() => {}}
        />

        <DungeonCard
          title="Enigma da Biblioteca"
          description="Resolva o quebra-cabeça histórico antes que o timer chegue a zero."
          rarity="rare"
          xpReward={150}
          coinsReward={25}
          diamondsReward={2}
          progress={0}
          type="quest"
          onAccept={() => {}}
        />

        <DungeonCard
          title="Missão: Caverna do Caos"
          description="Resolva 5 equações de segundo grau antes do tempo acabar. Dificuldade máxima."
          rarity="epic"
          xpReward={250}
          coinsReward={40}
          diamondsReward={5}
          progress={60}
          type="quest"
          onAccept={() => {}}
        />

        <DungeonCard
          title="Boss: Dragão da Matemática"
          description="Enfrente o dragão lendário respondendo corretamente a 10 questões consecutivas."
          rarity="legendary"
          xpReward={500}
          coinsReward={100}
          diamondsReward={15}
          type="boss"
          onAccept={() => {}}
        />
      </div>
    </div>
  );
}

export default DungeonCard;
